export const metadata = {
  title: 'Aviso de Privacidade — RealTools',
}

export default function PrivacyNoticePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-foreground">
      <h1 className="mb-2 text-2xl font-semibold">Aviso de Privacidade</h1>
      <p className="mb-8 text-sm text-muted-foreground">Última atualização: julho de 2026</p>

      <div className="space-y-8 text-[15px] leading-relaxed text-foreground/90">
        <section>
          <h2 className="mb-2 text-base font-semibold">1. Controlador</h2>
          <p>
            O RealTools é operado por <strong>Benicio Rios Ramos</strong>, pessoa física, que atua
            como controlador dos dados pessoais tratados nesta plataforma nos termos da Lei Geral
            de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>
          <p className="mt-2">
            Contato: <a className="underline" href="mailto:rbenirios09@gmail.com">rbenirios09@gmail.com</a>
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">2. Encarregado (DPO)</h2>
          <p>
            O encarregado pelo tratamento de dados pessoais (Art. 41 da LGPD) é{' '}
            <strong>Benicio Rios Ramos</strong>, disponível em{' '}
            <a className="underline" href="mailto:rbenirios09@gmail.com">rbenirios09@gmail.com</a>{' '}
            para dúvidas, solicitações ou reclamações relacionadas ao tratamento de dados pessoais.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">3. Quais dados coletamos</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Corretores (usuários da plataforma):</strong> nome, email e dados de conta via Clerk.</li>
            <li><strong>Investidores/clientes:</strong> nome, email, telefone, perfil de investimento (orçamento, estratégia, tolerância a risco, bairros de interesse) e anotações inseridas pelo corretor.</li>
            <li><strong>Compradores (buyers):</strong> nome, email e histórico de interações com Memorandos de Oportunidade (OM).</li>
            <li><strong>Terceiros em anúncios:</strong> dados eventualmente presentes em anúncios públicos coletados de portais de classificados (ex.: OLX), como nome/telefone de vendedores mencionados na descrição do imóvel.</li>
            <li><strong>Dados de localização e mercado:</strong> demografia agregada e comércios próximos a um imóvel, usados apenas em nível de área/bairro — nunca associados a uma pessoa física identificada.</li>
            <li><strong>Dados de uso:</strong> data/hora de abertura de um OM enviado por email (rastreamento por link único), para o corretor saber se o destinatário visualizou o material.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">4. Para que usamos esses dados</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Permitir que corretores gerenciem negócios, notas e arquivos de cada oportunidade.</li>
            <li>Calcular pontuações de atratividade de imóveis e compatibilidade com o perfil de investidores.</li>
            <li>Enviar e rastrear a abertura de Memorandos de Oportunidade a investidores/compradores.</li>
            <li>Gerar resumos e organização de descrições de imóveis com apoio de inteligência artificial.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">5. Base legal</h2>
          <p>
            O tratamento se baseia principalmente em <strong>legítimo interesse</strong> (Art. 7º,
            IX da LGPD) para a gestão de relacionamento comercial entre corretor e seus
            investidores/clientes, e em <strong>execução de contrato</strong> quando aplicável ao
            uso da plataforma pelo corretor.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">6. Com quem compartilhamos dados</h2>
          <p className="mb-2">
            Usamos os seguintes prestadores de serviço (operadores) para operar a plataforma —
            todos com infraestrutura nos Estados Unidos, exceto onde indicado:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Supabase</strong> — banco de dados e armazenamento de arquivos.</li>
            <li><strong>Clerk</strong> — autenticação e gestão de contas de corretores.</li>
            <li><strong>Resend</strong> — envio de emails (Memorandos de Oportunidade).</li>
            <li><strong>Google (Maps/Places)</strong> — geolocalização e dados de comércios próximos.</li>
            <li><strong>OpenRouter / Google Gemini</strong> — geração de resumos de negócio e organização de descrições por IA.</li>
            <li><strong>Vercel</strong> — hospedagem da aplicação.</li>
          </ul>
          <p className="mt-2">
            Essas transferências internacionais são tratadas nos termos do Art. 33 da LGPD.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">7. Por quanto tempo guardamos os dados</h2>
          <p>
            Dados de negócios ativos são mantidos enquanto o negócio estiver em andamento na
            plataforma. Encerrado um negócio, nome e email de investidores associados a ele são
            anonimizados após <strong>2 anos</strong>, mantendo-se apenas metadados agregados
            (datas, valores, status) para fins de histórico e auditoria.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">8. Seus direitos</h2>
          <p className="mb-2">Nos termos do Art. 18 da LGPD, você pode solicitar a qualquer momento:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Confirmação da existência de tratamento de dados</li>
            <li>Acesso aos dados</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos</li>
            <li>Portabilidade dos dados</li>
            <li>Eliminação dos dados tratados com base em consentimento</li>
            <li>Revogação do consentimento, quando aplicável</li>
            <li>Oposição a tratamento realizado com base em legítimo interesse</li>
          </ul>
          <p className="mt-2">
            Para exercer qualquer um desses direitos, entre em contato pelo email informado na
            seção 2. Solicitações são respondidas em até 15 dias.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">9. Segurança</h2>
          <p>
            Adotamos medidas técnicas para proteger os dados tratados, incluindo controle de
            acesso por usuário, criptografia em trânsito e restrições de acesso a dados
            armazenados. Nenhum sistema é 100% livre de risco; em caso de incidente de segurança
            que possa acarretar risco relevante, notificaremos a ANPD e os titulares afetados
            conforme exigido pelo Art. 48 da LGPD.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">10. Alterações a este aviso</h2>
          <p>
            Este aviso pode ser atualizado periodicamente. A data da última atualização está
            indicada no topo desta página.
          </p>
        </section>
      </div>
    </main>
  )
}
