from __future__ import annotations

import csv
import io
import math
import re
from typing import NamedTuple

import numpy as np
import pandas as pd

# Uma variável inteira com até este número de valores distintos é tratada como discreta
LIMITE_UNICOS_DISCRETA = 12
CODIFICACOES = ("utf-8-sig", "latin-1")
SEPARADORES = ",;\t|"


class ErroDeDados(ValueError):
    """Problema nos dados enviados pelo usuário (vira resposta HTTP 400)."""


class Distribuicao(NamedTuple):
    tipo: str
    rotulos: list[str]
    pontos_medios: list[float]
    frequencias: np.ndarray
    amplitude: float
    limites: list[float] | None



# Leitura 

def ler_csv(arquivo) -> pd.DataFrame:
    texto = _decodificar(arquivo.read())
    if not texto.strip():
        raise ErroDeDados("O arquivo enviado está vazio.")

    try:
        df = pd.read_csv(io.StringIO(texto), sep=_detectar_separador(texto))
    except pd.errors.EmptyDataError as erro:
        raise ErroDeDados("O arquivo não contém dados.") from erro
    except (pd.errors.ParserError, csv.Error, ValueError) as erro:
        raise ErroDeDados(f"Não foi possível interpretar o CSV: {erro}") from erro

    return _converter_decimais_com_virgula(df)


def _detectar_separador(texto: str) -> str:
    amostra = "\n".join(texto.splitlines()[:20])
    try:
        return csv.Sniffer().sniff(amostra, delimiters=SEPARADORES).delimiter
    except csv.Error:
        return ","  


def _decodificar(conteudo: bytes) -> str:
    for codificacao in CODIFICACOES:
        try:
            return conteudo.decode(codificacao)
        except UnicodeDecodeError:
            continue
    raise ErroDeDados("Codificação do arquivo não reconhecida.")


def _converter_decimais_com_virgula(df: pd.DataFrame) -> pd.DataFrame:
    for coluna in df.select_dtypes(include="object").columns:
        valores = df[coluna].dropna().astype(str).str.strip()
        if valores.empty:
            continue
        convertidos = pd.to_numeric(valores.str.replace(",", ".", regex=False), errors="coerce")
        if convertidos.notna().all():
            df[coluna] = pd.to_numeric(
                df[coluna].astype(str).str.strip().str.replace(",", ".", regex=False),
                errors="coerce",
            )
    return df


def ler_valores_digitados(texto: str, nome: str = "") -> pd.DataFrame:

    nome = nome.strip() or "Dados"
    texto = re.sub(r",\s+", " ", texto or "")  # "12, 15, 18" → vírgula como separador
    tokens = [t for t in re.split(r"[\s;]+", texto) if t]
    if not tokens:
        raise ErroDeDados("Digite ao menos um valor.")

    valores = pd.to_numeric(pd.Series(tokens).str.replace(",", ".", regex=False), errors="coerce")
    invalidos = [t for t, v in zip(tokens, valores) if pd.isna(v)]
    if invalidos:
        exemplos = ", ".join(f"'{t}'" for t in invalidos[:5])
        raise ErroDeDados(
            f"Valores não numéricos: {exemplos}. Separe os valores com espaço, "
            "';' ou quebra de linha (ex.: 12 15 18 ou 1,5; 2,7)."
        )
    return pd.DataFrame({nome: valores})


def colunas_numericas(df: pd.DataFrame) -> list[str]:
    return df.select_dtypes(include="number").columns.tolist()



# Análise

def analisar_coluna(df: pd.DataFrame, coluna: str) -> dict:
    """Monta KPIs, tabela de frequência e dados do gráfico de uma coluna."""
    if coluna not in df.columns:
        raise ErroDeDados(f"A coluna '{coluna}' não existe no arquivo.")

    dados = pd.to_numeric(df[coluna], errors="coerce").dropna()
    if dados.empty:
        raise ErroDeDados(f"A coluna '{coluna}' não possui valores numéricos.")

    n = len(dados)
    unicos = int(dados.nunique())
    discreta = unicos <= LIMITE_UNICOS_DISCRETA and _somente_inteiros(dados)
    dist = _distribuicao_discreta(dados) if discreta else _distribuicao_continua(dados)

    return {
        "coluna": coluna,
        "resumo": {
            "tipo": dist.tipo,
            "n": n,
            "unicos": unicos,
            "min": float(dados.min()),
            "max": float(dados.max()),
        },
        "tabela": _montar_tabela(dist, n),
        "grafico": _montar_grafico(dist, discreta),
    }


def _somente_inteiros(dados: pd.Series) -> bool:
    return bool(np.all(np.mod(dados.to_numpy(), 1) == 0))


def _distribuicao_discreta(dados: pd.Series) -> Distribuicao:
    contagem = dados.value_counts().sort_index()
    valores = [float(v) for v in contagem.index]
    # Passo entre valores consecutivos (ex.: 0, 2, 4 → 2); usado nas pontas do polígono
    passo = float(np.diff(valores).min()) if len(valores) > 1 else 1.0
    return Distribuicao(
        tipo="Quantitativa Discreta",
        rotulos=[str(int(v)) for v in valores],
        pontos_medios=valores,
        frequencias=contagem.to_numpy(),
        amplitude=passo,
        limites=None,
    )


def numero_de_classes_sturges(n: int) -> int:
    return max(1, round(1 + 3.322 * math.log10(n)))


def _distribuicao_continua(dados: pd.Series) -> Distribuicao:
    minimo, maximo = float(dados.min()), float(dados.max())

    if minimo == maximo:
        # Todos os valores iguais (AT = 0): cria uma única classe de largura 1
        limites = np.array([minimo - 0.5, maximo + 0.5])
    else:
        k = numero_de_classes_sturges(len(dados))  # Número de classes (Regra de Sturges)
        at = maximo - minimo                       # Amplitude total: AT = máx − mín
        h = at / k                                 # Amplitude de classe: h = AT ÷ k

        # Limites das classes: mín, mín + h, mín + 2h, ..., máx
        limites = np.array([minimo + i * h for i in range(k + 1)])
        limites[-1] = maximo  

    frequencias, _ = np.histogram(dados, bins=limites)
    ultima = len(limites) - 2
    rotulos = [
        f"{_fmt(limites[i])} {'|---|' if i == ultima else '|---'} {_fmt(limites[i + 1])}"
        for i in range(len(limites) - 1)
    ]
    return Distribuicao(
        tipo="Quantitativa Contínua",
        rotulos=rotulos,
        pontos_medios=((limites[:-1] + limites[1:]) / 2).tolist(),
        frequencias=frequencias,
        amplitude=float(limites[1] - limites[0]),
        limites=limites.tolist(),
    )


def _fmt(valor: float) -> str:
    return f"{valor:.2f}".replace(".", ",")


def _montar_tabela(dist: Distribuicao, n: int) -> dict:
    fi = dist.frequencias.astype(int)
    fac = np.cumsum(fi)
    linhas = [
        {
            "classe": rotulo,
            "fi": int(f),
            "fr": f / n,
            "fr_pct": f / n * 100,
            "fac": int(a),
            "fac_pct": a / n * 100,  
        }
        for rotulo, f, a in zip(dist.rotulos, fi, fac)
    ]
    total = {"fi": int(fi.sum()), "fr": fi.sum() / n, "fr_pct": fi.sum() / n * 100}
    return {"linhas": _nativos(linhas), "total": _nativos(total)}


def _montar_grafico(dist: Distribuicao, discreta: bool) -> dict:
    pm, amp = dist.pontos_medios, dist.amplitude
    return {
        "discreta": discreta,
        "x": pm,
        "y": dist.frequencias.astype(int).tolist(),
        "rotulos": dist.rotulos,
        "amplitude": amp,
        "limites": dist.limites,
        "x_poligono": [pm[0] - amp, *pm, pm[-1] + amp],
        "y_poligono": [0, *dist.frequencias.astype(int).tolist(), 0],
    }


def _nativos(obj):
    if isinstance(obj, dict):
        return {k: _nativos(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_nativos(v) for v in obj]
    if isinstance(obj, np.generic):
        return obj.item()
    return obj