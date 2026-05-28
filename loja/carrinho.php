<?php
include 'cabecalho.php';

$erro = '';
$sucesso = '';

$carrinho = $_SESSION['carrinho'] ?? [];

function obterProdutosPorIds($ligacao, $ids) {
	if (empty($ids)) {
		return [];
	}
	$marcadores = implode(',', array_fill(0, count($ids), '?'));
	$tipos = str_repeat('i', count($ids));
	$stmt = $ligacao->prepare("SELECT id, nome, preco, stock FROM produtos WHERE id IN ($marcadores)");
	$stmt->bind_param($tipos, ...$ids);
	$stmt->execute();
	$resultado = $stmt->get_result();
	$produtos = [];
	while ($linha = $resultado->fetch_assoc()) {
		$produtos[$linha['id']] = $linha;
	}
	return $produtos;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	$acao = $_POST['action'] ?? '';

	if (isset($_POST['remove_id'])) {
		$produto_id = (int)$_POST['remove_id'];
		if ($produto_id > 0) {
			unset($carrinho[$produto_id]);
			$_SESSION['carrinho'] = $carrinho;
			$sucesso = 'Produto removido do carrinho.';
		}
		$acao = '';
	}

	if ($acao === 'update' && isset($_POST['quantidade']) && is_array($_POST['quantidade'])) {
		foreach ($_POST['quantidade'] as $id => $qty) {
			$id = (int)$id;
			$qty = max(0, (int)$qty);
			if ($id <= 0) {
				continue;
			}
			if ($qty === 0) {
				unset($carrinho[$id]);
			} else {
				$carrinho[$id] = $qty;
			}
		}
		$_SESSION['carrinho'] = $carrinho;
		$sucesso = 'Carrinho atualizado.';
	}


	if ($acao === 'checkout') {
		if (!isset($_SESSION['id'])) {
			$erro = 'Precisas de iniciar sessao para finalizar a compra.';
		} elseif (empty($carrinho)) {
			$erro = 'O carrinho esta vazio.';
		} else {
			$ids = array_keys($carrinho);
			$produtos = obterProdutosPorIds($conn, $ids);
			$total = 0;

			foreach ($carrinho as $id => $qty) {
				if (!isset($produtos[$id])) {
					$erro = 'Um produto do carrinho ja nao existe.';
					break;
				}
				if ((int)$produtos[$id]['stock'] < $qty) {
					$erro = 'Sem stock suficiente para ' . $produtos[$id]['nome'] . '.';
					break;
				}
				$total += ((float)$produtos[$id]['preco']) * $qty;
			}

			if ($erro === '') {
				$conn->begin_transaction();
				$ok = true;

				$stmtEncomenda = $conn->prepare("INSERT INTO encomendas (utilizador_id, total, estado) VALUES (?, ?, 'pendente')");
				$user_id = (int)$_SESSION['id'];
				$stmtEncomenda->bind_param('id', $user_id, $total);
				$ok = $stmtEncomenda->execute();
				$encomenda_id = $conn->insert_id;

				if ($ok) {
					$stmtItem = $conn->prepare('INSERT INTO itens_encomenda (encomenda_id, produto_id, quantidade, preco) VALUES (?, ?, ?, ?)');
					$stmtStock = $conn->prepare('UPDATE produtos SET stock = stock - ? WHERE id = ? AND stock >= ?');

					foreach ($carrinho as $id => $qty) {
						$preco = (float)$produtos[$id]['preco'];
						$stmtItem->bind_param('iiid', $encomenda_id, $id, $qty, $preco);
						if (!$stmtItem->execute()) {
							$ok = false;
							break;
						}

						$stmtStock->bind_param('iii', $qty, $id, $qty);
						if (!$stmtStock->execute() || $stmtStock->affected_rows === 0) {
							$ok = false;
							break;
						}
					}
				}

				if ($ok) {
					$conn->commit();
					$_SESSION['carrinho'] = [];
					$carrinho = [];
					$sucesso = 'Compra finalizada com sucesso!';
				} else {
					$conn->rollback();
					$erro = 'Erro ao finalizar a compra.';
				}
			}
		}
	}
}

$carrinho = $_SESSION['carrinho'] ?? [];
$produtos_carrinho = [];
$total_carrinho = 0;
if (!empty($carrinho)) {
	$produtos_carrinho = obterProdutosPorIds($conn, array_keys($carrinho));
	foreach ($carrinho as $id => $qty) {
		if (isset($produtos_carrinho[$id])) {
			$total_carrinho += ((float)$produtos_carrinho[$id]['preco']) * $qty;
		}
	}
}
?>

<section class="secao-carrinho">
	<div class="cartao-carrinho">
		<h2>Carrinho</h2>

		<?php if ($erro): ?>
			<div class="msg-erro">⚠ <?= htmlspecialchars($erro) ?></div>
		<?php endif; ?>
		<?php if ($sucesso): ?>
			<div class="msg-sucesso">✓ <?= htmlspecialchars($sucesso) ?></div>
		<?php endif; ?>

		<?php if (empty($carrinho)): ?>
			<div class="carrinho-vazio">O teu carrinho esta vazio.</div>
			<div class="acoes-carrinho" style="justify-content:center;">
				<a class="btn-primario" href="index.php" style="display:inline-block;width:auto;padding:0 24px;text-align:center;line-height:46px;text-decoration:none;">Ver produtos</a>
			</div>
		<?php else: ?>
			<form method="POST">
				<input type="hidden" name="action" value="update">
				<table class="tabela-carrinho">
					<thead>
						<tr>
							<th>Produto</th>
							<th>Preco</th>
							<th>Qtd</th>
							<th>Subtotal</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						<?php foreach ($carrinho as $id => $qty): ?>
							<?php if (!isset($produtos_carrinho[$id])) continue; ?>
							<?php $p = $produtos_carrinho[$id]; ?>
							<tr>
								<td><?= htmlspecialchars($p['nome']) ?></td>
								<td><?= number_format($p['preco'], 2) ?> €</td>
								<td>
									<input class="input-quantidade" type="number" min="0" name="quantidade[<?= $id ?>]" value="<?= $qty ?>">
								</td>
								<td><?= number_format($p['preco'] * $qty, 2) ?> €</td>
								<td>
									<button class="btn-secundario" type="submit" name="remove_id" value="<?= $id ?>">Remover</button>
								</td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>

				<div class="resumo-carrinho">
					<div class="total-carrinho">Total: <?= number_format($total_carrinho, 2) ?> €</div>
					<div class="acoes-carrinho">
						<button class="btn-secundario" type="submit">Atualizar</button>
					</div>
				</div>
			</form>

			<form method="POST" style="margin-top:16px;">
				<input type="hidden" name="action" value="checkout">
				<div class="acoes-carrinho">
					<button class="btn-primario" type="submit" style="width:auto;padding:0 28px;">Finalizar Compra</button>
				</div>
			</form>
		<?php endif; ?>
	</div>
</section>

<?php include 'rodape.php'; ?>
