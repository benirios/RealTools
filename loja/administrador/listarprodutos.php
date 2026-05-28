<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['admin']) || (int)$_SESSION['admin'] !== 1) {
    header('Location: index.php');
    exit;
}

include '../cabecalho.php';

$erro = '';
$sucesso = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'delete' && isset($_POST['produto_id'])) {
        $produto_id = (int)$_POST['produto_id'];

        if ($produto_id > 0) {
            $stmt = $conn->prepare('DELETE FROM produtos WHERE id = ?');
            $stmt->bind_param('i', $produto_id);

            if ($stmt->execute()) {
                $sucesso = 'Produto eliminado com sucesso!';
            } else {
                $erro = 'Erro ao eliminar produto.';
            }
        }
    }
}

$products_query = "SELECT p.id, p.nome, p.preco, p.stock, c.nome as categoria, p.promocao
                   FROM produtos p
                   LEFT JOIN categorias c ON p.categoria_id = c.id
                   ORDER BY p.id DESC";
$result_products = $conn->query($products_query);
$produtos = $result_products->fetch_all(MYSQLI_ASSOC);
?>

<style>
.admin-secao {
    display: flex;
    justify-content: center;
    padding: 2rem 1rem;
}

.admin-container {
    background: var(--bg-secondary);
    border-radius: 14px;
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 1000px;
    border-top: 4px solid var(--accent);
    box-shadow: 0 6px 30px var(--shadow);
}

.admin-container h2 {
    margin-bottom: 6px;
    color: var(--text-primary);
}

.admin-container .sub {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 1.6rem;
}

.msg-sucesso {
    background: rgba(34, 197, 94, 0.12);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 8px;
    padding: 0.6rem 0.9rem;
    font-size: 0.85rem;
    margin-bottom: 1.1rem;
    text-align: center;
}

.msg-erro {
    background: rgba(220, 50, 50, 0.12);
    color: #ef4444;
    border: 1px solid rgba(220, 50, 50, 0.3);
    border-radius: 8px;
    padding: 0.6rem 0.9rem;
    font-size: 0.85rem;
    margin-bottom: 1.1rem;
    text-align: center;
}

.products-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1.5rem;
    overflow-x: auto;
}

.products-table th,
.products-table td {
    padding: 12px;
    border-bottom: 1px solid var(--border);
    text-align: left;
    font-size: 0.9rem;
}

.products-table th {
    background: var(--bg-primary);
    color: var(--text-secondary);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
}

.products-table td {
    color: var(--text-primary);
}

.btn-delete {
    background: #ef4444;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: filter 0.2s;
}

.btn-delete:hover {
    filter: brightness(1.05);
}

.btn-back {
    background: var(--accent);
    color: var(--bg-primary);
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    display: inline-block;
    margin-top: 1rem;
}

.btn-back:hover {
    filter: brightness(1.05);
}

.admin-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 1.5rem;
}

.btn-add {
    background: var(--accent);
    color: var(--bg-primary);
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
}

.btn-add:hover {
    filter: brightness(1.05);
}

.vazio {
    text-align: center;
    color: var(--text-secondary);
    padding: 2rem 0;
}

.promo-badge {
    background: #ef4444;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
}
</style>

<section class="admin-secao">
    <div class="admin-container">
        <h2>Gerir Produtos</h2>
        <p class="sub">Lista de todos os produtos</p>

        <?php if ($erro): ?>
            <div class="msg-erro">⚠ <?= htmlspecialchars($erro) ?></div>
        <?php endif; ?>
        <?php if ($sucesso): ?>
            <div class="msg-sucesso">✓ <?= htmlspecialchars($sucesso) ?></div>
        <?php endif; ?>

        <div class="admin-actions">
            <a href="inserirprodutos.php" class="btn-add">+ Novo Produto</a>
        </div>

        <?php if (!empty($produtos)): ?>
            <div style="overflow-x: auto;">
                <table class="products-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Categoria</th>
                            <th>Preço</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($produtos as $p): ?>
                            <tr>
                                <td><?= $p['id'] ?></td>
                                <td><?= htmlspecialchars($p['nome']) ?></td>
                                <td><?= htmlspecialchars($p['categoria'] ?? 'Sem categoria') ?></td>
                                <td>€<?= number_format($p['preco'], 2) ?></td>
                                <td><?= $p['stock'] ?></td>
                                <td>
                                    <?php if ((int)$p['promocao'] === 1): ?>
                                        <span class="promo-badge">PROMOÇÃO</span>
                                    <?php else: ?>
                                        <span style="color: var(--text-secondary); font-size: 0.85rem;">Normal</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Tem a certeza que deseja eliminar este produto?');">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="produto_id" value="<?= $p['id'] ?>">
                                        <button type="submit" class="btn-delete">Eliminar</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php else: ?>
            <div class="vazio">
                <p>Nenhum produto encontrado.</p>
                <a href="inserirprodutos.php" class="btn-add">+ Adicionar Primeiro Produto</a>
            </div>
        <?php endif; ?>

        <a href="index.php" class="btn-back">← Voltar</a>
    </div>
</section>

<?php include '../rodape.php'; ?>
