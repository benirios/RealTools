<?php
include 'cabecalho.php';

$erro = '';
$sucesso = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $assunto = trim($_POST['assunto'] ?? '');
    $mensagem = trim($_POST['mensagem'] ?? '');

    if ($nome === '' || $email === '' || $assunto === '' || $mensagem === '') {
        $erro = 'Preenche todos os campos.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erro = 'Email invalido.';
    } else {
        $stmt = $conn->prepare('INSERT INTO contactos (nome, email, assunto, mensagem) VALUES (?, ?, ?, ?)');
        $stmt->bind_param('ssss', $nome, $email, $assunto, $mensagem);

        if ($stmt->execute()) {
            $sucesso = 'Mensagem enviada com sucesso!';
        } else {
            $erro = 'Erro ao enviar a mensagem. Tenta novamente.';
        }
    }
}
?>

<section class="painel-formulario">
    <div class="cartao-formulario" style="max-width:520px;">
        <h2>Contactos</h2>
        <p class="subtitulo">Fala connosco para suporte ou informacoes.</p>

        <?php if ($erro): ?>
            <div class="msg-erro">⚠ <?= htmlspecialchars($erro) ?></div>
        <?php endif; ?>

        <?php if ($sucesso): ?>
            <div class="msg-sucesso">✓ <?= htmlspecialchars($sucesso) ?></div>
        <?php endif; ?>

        <div class="subtitulo" style="text-align:left;margin-bottom:1.2rem;">
            <div>Rua da Informatica, 11 - Leiria</div>
            <div>info@infostore.pt</div>
            <div>+351 676 676 676</div>
        </div>

        <form method="POST">
            <label for="nome">Nome</label>
            <input type="text" id="nome" name="nome" placeholder="O teu nome" value="<?= htmlspecialchars($_POST['nome'] ?? '') ?>" required>

            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="o-teu@email.com" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required>

            <label for="assunto">Assunto</label>
            <input type="text" id="assunto" name="assunto" placeholder="Como podemos ajudar?" value="<?= htmlspecialchars($_POST['assunto'] ?? '') ?>" required>

            <label for="mensagem">Mensagem</label>
            <textarea id="mensagem" name="mensagem" rows="4" placeholder="Escreve aqui..." required><?= htmlspecialchars($_POST['mensagem'] ?? '') ?></textarea>

            <button type="submit" class="btn-primario">Enviar Mensagem</button>
        </form>
    </div>
</section>

<?php include 'rodape.php'; ?>
