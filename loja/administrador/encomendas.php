<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['admin']) || (int)$_SESSION['admin'] !== 1) {
    header('Location: index.php');
    exit;
}

include '../cabecalho.php';

$current_page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$current_page = max(1, $current_page);
$items_per_page = 20;
$offset = ($current_page - 1) * $items_per_page;

$count_query = "SELECT COUNT(*) as total FROM encomendas";
$result_count = $conn->query($count_query);
$row_count = $result_count->fetch_assoc();
$total_encomendas = $row_count['total'];
$total_pages = ceil($total_encomendas / $items_per_page);
$current_page = min($current_page, max(1, $total_pages));
$offset = ($current_page - 1) * $items_per_page;

$encomendas_query = "SELECT e.id, e.utilizador_id, u.nome, u.email, e.total, e.estado, e.criado_em
                     FROM encomendas e
                     JOIN utilizadores u ON e.utilizador_id = u.id
                     ORDER BY e.criado_em DESC
                     LIMIT ? OFFSET ?";
$stmt_encomendas = $conn->prepare($encomendas_query);
$stmt_encomendas->bind_param("ii", $items_per_page, $offset);
$stmt_encomendas->execute();
$result_encomendas = $stmt_encomendas->get_result();
$encomendas = $result_encomendas->fetch_all(MYSQLI_ASSOC);

$encomenda_detalhe = null;
if (isset($_GET['encomenda_id'])) {
    $enc_id = (int)$_GET['encomenda_id'];

    $detalhe_query = "SELECT e.id, e.utilizador_id, u.nome, u.email, e.total, e.estado, e.criado_em
                      FROM encomendas e
                      JOIN utilizadores u ON e.utilizador_id = u.id
                      WHERE e.id = ?";
    $stmt_detalhe = $conn->prepare($detalhe_query);
    $stmt_detalhe->bind_param("i", $enc_id);
    $stmt_detalhe->execute();
    $result_detalhe = $stmt_detalhe->get_result();
    $encomenda_detalhe = $result_detalhe->fetch_assoc();

    if ($encomenda_detalhe) {
        $itens_query = "SELECT ie.id, ie.produto_id, ie.quantidade, ie.preco, p.nome
                        FROM itens_encomenda ie
                        JOIN produtos p ON ie.produto_id = p.id
                        WHERE ie.encomenda_id = ?";
        $stmt_itens = $conn->prepare($itens_query);
        $stmt_itens->bind_param("i", $enc_id);
        $stmt_itens->execute();
        $result_itens = $stmt_itens->get_result();
        $itens_encomenda = $result_itens->fetch_all(MYSQLI_ASSOC);
    }
}

$prev_page = $current_page > 1 ? $current_page - 1 : null;
$next_page = $current_page < $total_pages ? $current_page + 1 : null;
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

.encomendas-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1.5rem;
    overflow-x: auto;
}

.encomendas-table th,
.encomendas-table td {
    padding: 12px;
    border-bottom: 1px solid var(--border);
    text-align: left;
    font-size: 0.9rem;
}

.encomendas-table th {
    background: var(--bg-primary);
    color: var(--text-secondary);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
}

.encomendas-table td {
    color: var(--text-primary);
}

.status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
}

.status-pendente {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
}

.status-confirmada {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
}

.status-entregue {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
}

.btn-view {
    background: var(--accent);
    color: var(--bg-primary);
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: filter 0.2s;
}

.btn-view:hover {
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

.detalhe-box {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.detalhe-header {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.detalhe-item {
    padding: 0.5rem 0;
}

.detalhe-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--text-secondary);
    font-weight: 700;
    margin-bottom: 0.25rem;
}

.detalhe-valor {
    font-size: 1rem;
    color: var(--text-primary);
    font-weight: 600;
}

.itens-table {
    width: 100%;
    border-collapse: collapse;
}

.itens-table th,
.itens-table td {
    padding: 10px;
    border-bottom: 1px solid var(--border);
    text-align: left;
    font-size: 0.85rem;
}

.itens-table th {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-weight: 700;
}

.vazio {
    text-align: center;
    color: var(--text-secondary);
    padding: 2rem 0;
}

.paginacao {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-top: 2rem;
    padding: 20px 0;
    flex-wrap: wrap;
}

.pag-btn {
    padding: 12px 24px;
    background: var(--accent);
    color: white;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
}

.pag-btn:hover:not(.desativado) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.pag-btn.desativado {
    opacity: 0.5;
    cursor: not-allowed;
}

.pag-info {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    padding: 0 20px;
}
</style>

<section class="admin-secao">
    <div class="admin-container">
        <h2>Gerir Encomendas</h2>
        <p class="sub">Histórico de encomendas dos clientes</p>

        <?php if ($encomenda_detalhe): ?>
            <div class="detalhe-box">
                <h3 style="margin-bottom: 1rem; color: var(--text-primary);">
                    Encomenda #<?= $encomenda_detalhe['id'] ?>
                </h3>

                <div class="detalhe-header">
                    <div class="detalhe-item">
                        <div class="detalhe-label">Cliente</div>
                        <div class="detalhe-valor"><?= htmlspecialchars($encomenda_detalhe['nome']) ?></div>
                    </div>
                    <div class="detalhe-item">
                        <div class="detalhe-label">Email</div>
                        <div class="detalhe-valor"><?= htmlspecialchars($encomenda_detalhe['email']) ?></div>
                    </div>
                    <div class="detalhe-item">
                        <div class="detalhe-label">Total</div>
                        <div class="detalhe-valor">€<?= number_format($encomenda_detalhe['total'], 2) ?></div>
                    </div>
                    <div class="detalhe-item">
                        <div class="detalhe-label">Estado</div>
                        <div>
                            <span class="status-badge status-<?= $encomenda_detalhe['estado'] ?>">
                                <?= ucfirst(htmlspecialchars($encomenda_detalhe['estado'])) ?>
                            </span>
                        </div>
                    </div>
                    <div class="detalhe-item">
                        <div class="detalhe-label">Data</div>
                        <div class="detalhe-valor"><?= date('d/m/Y H:i', strtotime($encomenda_detalhe['criado_em'])) ?></div>
                    </div>
                </div>

                <h4 style="margin: 1.5rem 0 1rem; color: var(--text-primary);">Produtos</h4>
                <?php if (!empty($itens_encomenda)): ?>
                    <table class="itens-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Preço Unit.</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($itens_encomenda as $item): ?>
                                <tr>
                                    <td><?= htmlspecialchars($item['nome']) ?></td>
                                    <td><?= $item['quantidade'] ?></td>
                                    <td>€<?= number_format($item['preco'], 2) ?></td>
                                    <td>€<?= number_format($item['preco'] * $item['quantidade'], 2) ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>

                <a href="encomendas.php" class="btn-back">← Voltar à Lista</a>
            </div>
        <?php else: ?>
            <?php if (!empty($encomendas)): ?>
                <div style="overflow-x: auto;">
                    <table class="encomendas-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Email</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Data</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($encomendas as $enc): ?>
                                <tr>
                                    <td>#<?= $enc['id'] ?></td>
                                    <td><?= htmlspecialchars($enc['nome']) ?></td>
                                    <td><?= htmlspecialchars($enc['email']) ?></td>
                                    <td>€<?= number_format($enc['total'], 2) ?></td>
                                    <td>
                                        <span class="status-badge status-<?= $enc['estado'] ?>">
                                            <?= ucfirst(htmlspecialchars($enc['estado'])) ?>
                                        </span>
                                    </td>
                                    <td><?= date('d/m/Y H:i', strtotime($enc['criado_em'])) ?></td>
                                    <td>
                                        <a href="?encomenda_id=<?= $enc['id'] ?>" class="btn-view">Ver</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <div class="paginacao">
                    <?php if ($prev_page): ?>
                        <a href="?page=<?= $prev_page ?>" class="pag-btn">← Anterior</a>
                    <?php else: ?>
                        <span class="pag-btn desativado">← Anterior</span>
                    <?php endif; ?>

                    <span class="pag-info">Página <?= $current_page ?> de <?= $total_pages ?></span>

                    <?php if ($next_page): ?>
                        <a href="?page=<?= $next_page ?>" class="pag-btn">Próximo →</a>
                    <?php else: ?>
                        <span class="pag-btn desativado">Próximo →</span>
                    <?php endif; ?>
                </div>
            <?php else: ?>
                <div class="vazio">
                    <p>Nenhuma encomenda registada.</p>
                </div>
            <?php endif; ?>

            <a href="index.php" class="btn-back">← Voltar</a>
        <?php endif; ?>
    </div>
</section>

<?php include '../rodape.php'; ?>
