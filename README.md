📊 App Estatística - Distribuição de Frequência

Uma aplicação web interativa projetada para realizar análises descritivas e gerar distribuições de frequência a partir de conjuntos de dados. O sistema permite o upload de arquivos CSV ou a inserção manual de dados, automatizando cálculos estatísticos complexos e gerando visualizações claras.

🚀 Funcionalidades

Entrada Flexível de Dados: Suporte para importação de arquivos .csv ou digitação manual de valores observados.

Classificação Automática: O algoritmo detecta e separa automaticamente variáveis quantitativas discretas e contínuas (utilizando a Regra de Sturges para definição de classes).

Tabelas de Frequência Completas: Cálculo instantâneo de Frequência Absoluta (Fi), Frequência Relativa (fr), Percentual (%) e Frequência Acumulada (Fac).

Visualização Gráfica Interativa: Geração de Histogramas (para variáveis contínuas) e Gráficos de Barras / Polígonos de Frequência (para variáveis discretas) utilizando Plotly.

KPIs Resumidos: Exibição imediata do número de observações (n), valores únicos, valor mínimo e valor máximo.

🛠️ Tecnologias Utilizadas

Backend (Lógica e Processamento):

Python - Linguagem principal.

Flask - Servidor web e roteamento de API.

Pandas & NumPy - Tratamento de dados, cálculos estatísticos e estruturação de dataframes.

Frontend (Interface e Interatividade):

HTML5, CSS3 e JavaScript (Vanilla).

Tailwind CSS (via CDN) - Estilização responsiva e moderna.

Plotly.js - Renderização dos gráficos interativos.

Phosphor Icons - Ícones da interface.

📁 Estrutura do Projeto

app_estatistica/
├── app.py                 # Servidor Flask e definição de rotas HTTP
├── estatistica.py         # Módulo com a lógica estatística e tratamento de dados
├── requirements.txt       # Dependências do Python
├── .gitignore             # Arquivos ignorados pelo Git
├── templates/
│   └── index.html         # Estrutura principal da página web
└── static/
    ├── script.js          # Lógica do frontend, chamadas à API e renderização dos gráficos
    └── style.css          # Estilos personalizados (além do Tailwind)


⚙️ Como executar localmente

Siga os passos abaixo para rodar o projeto na sua própria máquina.

1. Pré-requisitos

Certifique-se de ter o Python (versão 3.8 ou superior) instalado no seu sistema.

2. Clonar o repositório

Abra o terminal e execute:

git clone https://github.com/andrreLuiz/app_estatistica.git
cd app_estatistica


3. Criar e ativar um ambiente virtual (Recomendado)

Para isolar as dependências do projeto:

Windows:

python -m venv venv
venv\Scripts\activate


Linux / macOS:

python3 -m venv venv
source venv/bin/activate


4. Instalar as dependências

Com o ambiente ativado, instale as bibliotecas necessárias:

pip install -r requirements.txt


5. Iniciar o servidor

Execute o arquivo principal do Flask:

python app.py


O terminal exibirá uma mensagem informando que o servidor está rodando. Acesse http://localhost:5000 no seu navegador para utilizar o aplicativo.

📄 Licença

Este projeto é de uso livre para estudos e aprimoramentos. Sinta-se à vontade para clonar, modificar e contribuir!