# 📊 App Estatística - Distribuição de Frequência

> Uma aplicação web interativa projetada para realizar análises descritivas e gerar distribuições de frequência a partir de conjuntos de dados. O sistema permite o upload de arquivos CSV ou a inserção manual de dados, automatizando cálculos estatísticos complexos e gerando visualizações claras.

## 🚀 Funcionalidades

- **Entrada Flexível de Dados:** Suporte para importação de arquivos `.csv` ou digitação manual de valores observados.
- **Classificação Automática:** O algoritmo detecta e separa automaticamente variáveis quantitativas discretas e contínuas (utilizando a Regra de Sturges para definição de classes).
- **Tabelas de Frequência Completas:** Cálculo instantâneo de Frequência Absoluta (Fi), Frequência Relativa (fr), Percentual (%) e Frequência Acumulada (Fac).
- **Visualização Gráfica Interativa:** Geração de Histogramas (para variáveis contínuas) e Gráficos de Barras / Polígonos de Frequência (para variáveis discretas).
- **KPIs Resumidos:** Exibição imediata do número de observações (n), valores únicos, valor mínimo e valor máximo.

## 🛠️ Tecnologias Utilizadas

**Backend (Lógica e Processamento):**
- ![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
- ![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
- ![Pandas](https://img.shields.io/badge/pandas-%23150458.svg?style=for-the-badge&logo=pandas&logoColor=white)
- ![NumPy](https://img.shields.io/badge/numpy-%23013243.svg?style=for-the-badge&logo=numpy&logoColor=white)

**Frontend (Interface e Interatividade):**
- ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
- ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
- ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
- ![Plotly](https://img.shields.io/badge/Plotly-%233F4F75.svg?style=for-the-badge&logo=plotly&logoColor=white)

## 📁 Estrutura do Projeto

```text
app_estatistica/
├── app.py               # Servidor Flask e rotas HTTP
├── estatistica.py       # Módulo com a lógica estatística e tratamento de dados
├── requirements.txt     # Dependências do Python
├── .gitignore           # Arquivos ignorados pelo Git
├── templates/
│   └── index.html       # Estrutura principal da página web
└── static/
    ├── script.js        # Lógica de interface e chamadas de API
    └── style.css        # Estilos customizados
```

## ⚙️ Como executar localmente

Siga os passos abaixo para rodar o projeto na sua própria máquina.

**1. Clonar o repositório**
```bash
git clone https://github.com/andrreLuiz/app_estatistica.git
cd app_estatistica
```

**2. Criar e ativar um ambiente virtual**
* No Windows:
```bash
python -m venv venv
venv\Scripts\activate
```
* No Linux / macOS:
```bash
python3 -m venv venv
source venv/bin/activate
```

**3. Instalar dependências e rodar**
```bash
pip install -r requirements.txt
python app.py
```

Acesse `http://localhost:5000` no seu navegador para utilizar o aplicativo!