<?php
include 'cabecalho.php';

$erro = '';
$sucesso = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $palavra_passe = $_POST['palavra_passe'] ?? '';
    $confirmar = $_POST['confirmar'] ?? '';

    if ($nome === '' || $email === '' || $palavra_passe === '' || $confirmar === '') {
        $erro = 'Preenche todos os campos.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erro = 'Email invalido.';
    } elseif (strlen($palavra_passe) < 6) {
        $erro = 'A palavra-passe deve ter pelo menos 6 caracteres.';
    } elseif ($palavra_passe !== $confirmar) {
        $erro = 'As palavras-passe nao coincidem.';
    } else {
        $stmt = $conn->prepare('SELECT id FROM utilizadores WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            $erro = 'Este email ja esta registado.';
        } else {
            $hash = password_hash($palavra_passe, PASSWORD_DEFAULT);
            $stmt2 = $conn->prepare('INSERT INTO utilizadores (nome, email, palavra_passe, criado_em) VALUES (?, ?, ?, NOW())');
            $stmt2->bind_param('sss', $nome, $email, $hash);

            if ($stmt2->execute()) {
                $sucesso = 'Conta criada com sucesso! Podes fazer login.';
            } else {
                $erro = 'Erro ao criar a conta. Tenta novamente.';
            }
        }
    }
}
?>

<section class="painel-formulario">
    <div class="cartao-formulario" style="text-align:center;">
        <h2>Criar Conta</h2>
        <p class="subtitulo">Junta-te à SoleDrop</p>

        <?php if ($erro): ?>
            <div class="msg-erro">⚠ <?= htmlspecialchars($erro) ?></div>
        <?php endif; ?>

        <?php if ($sucesso): ?>
            <div class="msg-sucesso">✓ <?= htmlspecialchars($sucesso) ?></div>
        <?php endif; ?>

        <?php if (!$sucesso): ?>
        <form method="POST">
            <label for="nome">Nome</label>
            <input type="text" id="nome" name="nome"
                placeholder="O teu nome"
                value="<?= htmlspecialchars($_POST['nome'] ?? '') ?>" required>

            <label for="email">Email</label>
            <input type="email" id="email" name="email"
                placeholder="o-teu@email.com"
                value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required>

            <label for="palavra_passe">Palavra-passe</label>
            <input type="password" id="palavra_passe" name="palavra_passe"
                placeholder="Minimo 6 caracteres" required>

            <label for="confirmar">Confirmar Palavra-passe</label>
            <input type="password" id="confirmar" name="confirmar"
                placeholder="Repete a palavra-passe" required>

            <button type="submit" class="btn-primario">Criar Conta</button>
        </form>
        <?php endif; ?>

        <p class="subtitulo" style="margin-top:1.2rem;margin-bottom:0;">
            Ja tens conta? <a href="login.php" style="color:var(--cor-destaque);font-weight:700;">Inicia sessao aqui</a>
        </p>
    </div>
</section>

<?php include 'rodape.php'; ?>
