    </div>
    </main>

    <footer class="site-footer">
        <div class="footer-grid">

            <div class="footer-col">
                <h4>SoleDrop</h4>
                <p>A tua sneaker store em Leiria.<br>Sapatilhas autênticas com garantia.<br>Envio para todo o país.</p>
                <br>
                <div class="footer-contact">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <span>+351 676 676 676</span>
                </div>
                <div class="footer-contact">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <span>hello@soledrop.pt</span>
                </div>
                <div class="footer-contact">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>Leiria, Portugal</span>
                </div>
            </div>

            <div class="footer-col">
                <h4>Shop</h4>
                <ul>
                    <li><a href="<?= $prefixo_raiz ?>portateis.php">Lifestyle</a></li>
                    <li><a href="<?= $prefixo_raiz ?>gaming.php">Running</a></li>
                    <li><a href="<?= $prefixo_raiz ?>lancamentos.php">New Drops</a></li>
                    <li><a href="<?= $prefixo_raiz ?>componentes.php">Basketball</a></li>
                    <li><a href="<?= $prefixo_raiz ?>perifericos.php">Skate</a></li>
                    <li><a href="<?= $prefixo_raiz ?>promocoes.php">Sale</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Informações</h4>
                <ul>
                    <li><a href="#">Sobre nós</a></li>
                    <li><a href="#">Tamanhos &amp; Fit</a></li>
                    <li><a href="#">Envios e Entregas</a></li>
                    <li><a href="#">Devoluções</a></li>
                    <li><a href="#">Autenticidade</a></li>
                    <li><a href="<?= $prefixo_raiz ?>contactos.php">Contacto</a></li>
                </ul>
            </div>

        </div>

        <div class="footer-bottom">
            &copy; <?= date('Y') ?> <strong>SoleDrop</strong> — Todos os direitos reservados &nbsp;|&nbsp;
            <a href="#">Política de Privacidade</a> &nbsp;|&nbsp;
            <a href="#">Termos e Condições</a>
        </div>
    </footer>

    <script>
        const botaoTema = document.getElementById('themeToggle');
        const elementoHtml = document.documentElement;
        const iconeSol = document.getElementById('sunIcon');
        const iconeLua = document.getElementById('moonIcon');

        const temaGuardado = localStorage.getItem('theme') || 'light';
        elementoHtml.setAttribute('data-theme', temaGuardado);
        atualizarIconeTema(temaGuardado);

        botaoTema.addEventListener('click', () => {
            const temaAtual = elementoHtml.getAttribute('data-theme');
            const novoTema = temaAtual === 'light' ? 'dark' : 'light';

            elementoHtml.setAttribute('data-theme', novoTema);
            localStorage.setItem('theme', novoTema);
            atualizarIconeTema(novoTema);
        });

        function atualizarIconeTema(tema) {
            if (tema === 'dark') {
                iconeSol.style.display = 'none';
                iconeLua.style.display = 'block';
            } else {
                iconeSol.style.display = 'block';
                iconeLua.style.display = 'none';
            }
        }
    </script>

</body>
</html>
