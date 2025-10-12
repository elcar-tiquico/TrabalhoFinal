import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import styles from "./sobre.module.css"

export default function Sobre() {
  return (
    <main>
      <Header />
      <div className="container">
        <div className={styles.sobreContainer}>
          <div className={styles.sobreHeader}>
            <h1 className={styles.sobreTitle}>Sobre o Projecto</h1>
            <p className={styles.sobreSubtitle}>
              Base de dados de plantas medicinais com suporte a línguas locais em Moçambique
            </p>
          </div>

          <div className={styles.sobreContent}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Objectivo</h2>
              <p className={styles.sectionText}>
                Este sistema tem como objectivo principal disponibilizar uma plataforma digital para organização,
                visualização e consulta de informações sobre plantas medicinais utilizadas em Moçambique, com suporte a
                línguas locais. A aplicação permite que investigadores, profissionais de saúde e comunidades locais acedam
                a dados estruturados, cientificamente validados, de forma acessível e multilíngue.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Funcionalidades</h2>
              <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🧾</div>
                  <h3 className={styles.featureTitle}>Dados Estruturados</h3>
                  <p className={styles.featureText}>
                    Organização das plantas com atributos como nome comum, científico, local de colheita e usos.
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🌍</div>
                  <h3 className={styles.featureTitle}>Suporte Multilíngue</h3>
                  <p className={styles.featureText}>
                    Traduções para línguas locais, como Emakhuwa e Xichangana.
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🔬</div>
                  <h3 className={styles.featureTitle}>Validação Científica</h3>
                  <p className={styles.featureText}>
                    Informação baseada em fontes académicas e dados preenchidos pelo curso de Farmácia e Controle de Qualidade de Medicamentos do ISCTEM.
                  </p>
                </div>
              </div>
            </section>

            {/* <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Metodologia</h2>
              <p className={styles.sectionText}>
                A metodologia adoptada neste projecto combinou abordagens de investigação aplicada, qualitativa,
                exploratória, documental e bibliográfica. A base de dados foi construída a partir de fontes científicas
                validadas, incluindo publicações académicas, livros, artigos indexados, dissertações e
                registos fornecidos por especialistas do curso de Farmácia do ISCTEM. A recolha e selecção dos dados
                seguiram critérios de relevância, autenticidade e credibilidade, assegurando a confiabilidade e a
                integridade das informações armazenadas.
              </p>
            </section> */}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Impacto Esperado</h2>
              <div className={styles.importanceList}>
                <div className={styles.importanceItem}>
                  <h4 className={styles.importanceTitle}>Acesso ao Conhecimento</h4>
                  <p className={styles.importanceText}>
                    Facilita o acesso da população moçambicana à informação sobre plantas medicinais nas suas línguas.
                  </p>
                </div>
                <div className={styles.importanceItem}>
                  <h4 className={styles.importanceTitle}>Preservação Cultural</h4>
                  <p className={styles.importanceText}>
                    Ajuda a preservar o saber ancestral, muitas vezes transmitido oralmente e em risco de extinção.
                  </p>
                </div>
                <div className={styles.importanceItem}>
                  <h4 className={styles.importanceTitle}>Integração Académica</h4>
                  <p className={styles.importanceText}>
                    Permite que os dados colectados pelo curso de Farmácia sejam digitalizados e amplamente acessíveis.
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Responsáveis</h2>
              <div className={styles.teamGrid}>
                <div className={styles.teamMember}>
                  <h4 className={styles.memberName}>Elcar Tíquico Macuácua</h4>
                  <p className={styles.memberRole}>Estudante de Engenharia Informática</p>
                  <p className={styles.memberDescription}>
                    Responsável pelo desenvolvimento, modelação, estruturação e implementação da base de dados, sob a supervisão da Msc. Otília Graça.
                  </p>
                </div>
                <div className={styles.teamMember}>
                  <h4 className={styles.memberName}>Curso de Farmácia e Controle de Qualidade de Medicamentos</h4>
                  <p className={styles.memberRole}>Fonte de dados e validação</p>
                  <p className={styles.memberDescription}>
                    Validação e alimentação da base ded dados.
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Como Utilizar</h2>
              <div className={styles.usageSteps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Aceda à Pesquisa</h4>
                    <p className={styles.stepText}>
                      Utilize o formulário de pesquisa na página inicial para encontrar plantas específicas
                    </p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Defina Critérios</h4>
                    <p className={styles.stepText}>
                      Filtre por nome popular, científico, província, uso tradicional ou autor
                    </p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Explore os Resultados</h4>
                    <p className={styles.stepText}>
                      Analise as informações detalhadas sobre cada planta e suas propriedades
                    </p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h4 className={styles.stepTitle}>Consulte Referências</h4>
                    <p className={styles.stepText}>
                      Aceda às fontes científicas para aprofundar o seu conhecimento
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Contacto</h2>
              <p className={styles.sectionText}>
                Para sugestões, colaboração ou correcções, entre em contacto.
              </p>
              <div className={styles.contactInfo}>
                <p className={styles.contactText}>
                  <strong>Instituto Superior de Ciências e Tecnologia de Moçambique</strong> <br />
                  Curso de Farmácia e Controle de Qualidade de Medicamentos
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
