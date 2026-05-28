<?php
if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

if (isset($_GET['logout'])) {
	session_destroy();
	header('Location: login.php');
	exit;
}

include 'cabecalho.php';

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
		$utilizador = $result->fetch_assoc();

		if ($utilizador && password_verify($palavra_passe, $utilizador['palavra_passe'])) {
			$_SESSION['id'] = $utilizador['id'];
			$_SESSION['nome'] = $utilizador['nome'];
			$_SESSION['admin'] = (int)($utilizador['admin'] ?? 0);
			$sucesso = 'Sessao iniciada com sucesso.';
		} else {
			$erro = 'Email ou palavra-passe incorretos.';
		}
	}
}

$sessao_ativa = isset($_SESSION['id']);
?>

<section class="painel-formulario">
	<div class="cartao-formulario" style="text-align:center;">

		<?php if ($sessao_ativa): ?>
			<div style="padding:0.5rem 0;">
				<div style="font-size:3rem;margin-bottom:.8rem;">👋</div>
				<h3 style="margin-bottom:.4rem;">Ola, <?= htmlspecialchars($_SESSION['nome']) ?>!</h3>
				<p class="subtitulo">Ja tens sessao iniciada.</p>
				<a href="login.php?logout=1">
					<button class="btn-secundario" style="border-color:#dc2626;color:#dc2626;">Terminar Sessao</button>
				</a>
			</div>

		<?php else: ?>
			<h2>Iniciar Sessao</h2>
			<p class="subtitulo">Entra na tua conta SoleDrop</p>

			<?php if ($erro): ?>
				<div class="msg-erro">⚠ <?= htmlspecialchars($erro) ?></div>
			<?php endif; ?>
			<?php if ($sucesso): ?>
				<div class="msg-sucesso">✓ <?= htmlspecialchars($sucesso) ?></div>
			<?php endif; ?>

			<form method="POST">
				<label for="email">Email</label>
				<input type="email" id="email" name="email"
					placeholder="o-teu@email.com"
					value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required>

				<label for="palavra_passe">Palavra-passe</label>
				<input type="password" id="palavra_passe" name="palavra_passe"
					placeholder="••••••••" required>

				<button type="submit" class="btn-primario">Entrar</button>
			</form>

			<p class="subtitulo" style="margin-top:1.2rem;margin-bottom:0;">
				Nao tens conta? <a href="registar.php" style="color:var(--cor-destaque);font-weight:700;">Regista-te aqui</a>
			</p>
		<?php endif; ?>

	</div>
</section>

<?php include 'rodape.php'; ?>