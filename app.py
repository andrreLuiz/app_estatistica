"""Servidor Flask: apenas rotas HTTP. A lógica estatística fica em estatistica.py."""
from flask import Flask, jsonify, render_template, request
from werkzeug.exceptions import HTTPException, RequestEntityTooLarge

from estatistica import (
    ErroDeDados,
    analisar_coluna,
    colunas_numericas,
    ler_csv,
    ler_valores_digitados,
)

TAMANHO_MAXIMO_MB = 10

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = TAMANHO_MAXIMO_MB * 1024 * 1024
app.json.sort_keys = False  # mantém a ordem das chaves no JSON


def _dataframe_enviado():
    arquivo = request.files.get("file")
    if arquivo is None or not arquivo.filename:
        raise ErroDeDados("Nenhum arquivo enviado.")
    return ler_csv(arquivo)


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/colunas")
def listar_colunas():
    return jsonify(colunas=colunas_numericas(_dataframe_enviado()))


@app.post("/api/analisar")
def analisar():
    coluna = request.form.get("coluna", "").strip()
    if not coluna:
        raise ErroDeDados("Nenhuma coluna selecionada.")
    return jsonify(analisar_coluna(_dataframe_enviado(), coluna))


@app.post("/api/analisar-texto")
def analisar_texto():
    df = ler_valores_digitados(request.form.get("dados", ""), request.form.get("nome", ""))
    return jsonify(analisar_coluna(df, df.columns[0]))


# Tratamento de erros centralizado 
@app.errorhandler(ErroDeDados)
def erro_de_dados(erro):
    return jsonify(error=str(erro)), 400


@app.errorhandler(RequestEntityTooLarge)
def arquivo_grande(_erro):
    return jsonify(error=f"O arquivo excede o limite de {TAMANHO_MAXIMO_MB} MB."), 413


@app.errorhandler(Exception)
def erro_inesperado(erro):
    if isinstance(erro, HTTPException):  
        return erro
    app.logger.exception("Erro inesperado ao processar a requisição")
    return jsonify(error="Erro interno ao processar os dados."), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)