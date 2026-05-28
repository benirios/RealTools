<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit;
}

include '../cabecalho.php';

$erro = '';
$sucesso = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $palavra_passe = $_POST['palavra_passe'] ?? '';

    if ($email === '' || $palavra_passe === '') {
        $erro = 'Preenche todos os campos.';
    } else {
        $stmt = $conn->prepare('SELECT id, nome, palavra_passe, admin FROM utilizadores WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user && password_verify($palavra_passe, $user['palavra_passe'])) {
            if ((int)($user['admin'] ?? 0) !== 1) {
                $erro = 'Sem permissao de administrador.';
            } else {
                $_SESSION['id'] = $user['id'];
                $_SESSION['nome'] = $user['nome'];
                $_SESSION['admin'] = 1;
                header('Location: index.php?logado=1');
                exit;
            }
        } else {
            $erro = 'Email ou palavra-passe incorretos.';
        }
    }
}

$admin_logado = isset($_SESSION['admin']) && (int)$_SESSION['admin'] === 1;
?>

<style>
.admin-secao{display:flex;justify-content:center;padding:3rem 1rem}
.admin-card{background:var(--bg-secondary);border-radius:14px;padding:2.5rem 2rem;width:100%;max-width:460px;border-top:4px solid var(--accent);box-shadow:0 6px 30px var(--shadow);text-align:center}
.admin-card h2{font-size:1.4rem;color:var(--text-primary);margin-bottom:.3rem}
.admin-card .sub{font-size:.85rem;color:var(--text-secondary);margin-bottom:1.8rem}
.admin-card label{display:block;text-align:left;font-size:.78rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.35rem}
.admin-card input[type="email"],
.admin-card input[type="password"]{width:100%;height:44px;background:var(--bg-primary);border:1.5px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:.9rem;padding:0 1rem;outline:none;margin-bottom:1.2rem;transition:border-color .2s}
.admin-card input:focus{border-color:var(--accent)}
.admin-card input::placeholder{color:var(--text-secondary)}
.admin-card .btn-entrar{width:100%;height:46px;background:var(--accent);color:var(--bg-primary);font-size:1rem;font-weight:700;border:none;border-radius:8px;cursor:pointer;transition:filter .2s}
.admin-card .btn-entrar:hover{filter:brightness(1.05)}
.msg-erro{background:rgba(220,50,50,.12);color:#ef4444;border:1px solid rgba(220,50,50,.3);border-radius:8px;padding:.6rem .9rem;font-size:.85rem;margin-bottom:1.1rem}
.msg-sucesso{background:rgba(34,197,94,.12);color:#22c55e;border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:.6rem .9rem;font-size:.85rem;margin-bottom:1.1rem}
.admin-actions{display:flex;flex-direction:column;gap:12px;margin-top:1.4rem}
.admin-actions a{display:block;text-decoration:none;background:var(--accent);color:var(--bg-primary);padding:12px;border-radius:8px;font-weight:700}
.admin-actions a:hover{filter:brightness(1.05)}
.btn-logout{background:transparent;border:2px solid #ef4444;color:#ef4444;border-radius:8px;padding:.5rem 1.5rem;font-size:.9rem;font-weight:700;cursor:pointer;transition:background .2s,color .2s}
.btn-logout:hover{background:#ef4444;color:#fff}
</style>

<section class="admin-secao">
    <div class="admin-card">
        <?php if ($admin_logado): ?>
            <h2>Area de Administracao</h2>
            <p class="sub">Gerir produtos e catalogo</p>
            <?php if ($sucesso): ?>
                <div class="msg-sucesso">✓ <?= $sucesso ?></div>
            <?php endif; ?>
            <div class="admin-actions">
                <a href="inserirprodutos.php">+ Inserir Produto</a>
                <a href="listarprodutos.php">📦 Gerir Produtos</a>
                <a href="encomendas.php">📋 Ver Encomendas</a>
                <a href="../index.php">← Voltar à Loja</a>
            </div>
            <div style="margin-top:16px;">
                <a href="index.php?logout=1"><button class="btn-logout">Terminar Sessao</button></a>
            </div>
        <?php else: ?>
            <h2>Login Administrador</h2>
            <p class="sub">Acesso restrito</p>

            <?php if ($erro): ?>
                <div class="msg-erro">⚠ <?= htmlspecialchars($erro) ?></div>
            <?php endif; ?>
            <?php if ($sucesso): ?>
                <div class="msg-sucesso">✓ <?= htmlspecialchars($sucesso) ?></div>
            <?php endif; ?>

            <form method="POST">
                <label for="email">Email</label>
                <input type="email" id="email" name="email"
                    placeholder="admin@infostore.pt"
                    value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required>

                <label for="palavra_passe">Palavra-passe</label>
                <input type="password" id="palavra_passe" name="palavra_passe"
                    placeholder="••••••••" required>

                <button type="submit" class="btn-entrar">Entrar</button>
            </form>
        <?php endif; ?>
    </div>
</section>

<?php include '../rodape.php'; ?>
