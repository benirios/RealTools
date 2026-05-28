<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

include 'cabecalho.php';

$query = isset($_GET['q']) ? trim($_GET['q']) : '';
$numero_pagina = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$numero_pagina = max(1, $numero_pagina);
$produtos_por_pagina = 32;

$resultados = [];
$total_resultados = 0;
$total_pages = 1;

if ($query !== '') {
    $search_term = '%' . $query . '%';

    $count_query = "SELECT COUNT(*) as total FROM produtos WHERE nome LIKE ? OR descricao LIKE ?";
    $stmt_count = $conn->prepare($count_query);
    $stmt_count->bind_param("ss", $search_term, $search_term);
    $stmt_count->execute();
    $row_count = $stmt_count->get_result()->fetch_assoc();
    $total_resultados = $row_count['total'];
    $total_pages = ceil($total_resultados / $produtos_por_pagina);
    $numero_pagina = min($numero_pagina, max(1, $total_pages));

    $offset = ($numero_pagina - 1) * $produtos_por_pagina;

    $products_query = "SELECT p.id, p.nome, p.preco, p.stock, p.categoria_id, c.nome as categoria
                       FROM produtos p
                       JOIN categorias c ON p.categoria_id = c.id
                       WHERE p.nome LIKE ? OR p.descricao LIKE ?
                       ORDER BY p.id
                       LIMIT ? OFFSET ?";
    $stmt_products = $conn->prepare($products_query);
    $stmt_products->bind_param("ssii", $search_term, $search_term, $produtos_por_pagina, $offset);
    $stmt_products->execute();
    $result_products = $stmt_products->get_result();
    $resultados = $result_products->fetch_all(MYSQLI_ASSOC);
}

$mensagem_carrinho = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['produto_id'])) {
    $produto_id = (int)$_POST['produto_id'];
    $quantidade = (int)($_POST['quantidade'] ?? 1);
    $quantidade = max(1, $quantidade);

    if ($produto_id > 0) {
        if (!isset($_SESSION['carrinho']) || !is_array($_SESSION['carrinho'])) {
            $_SESSION['carrinho'] = [];
        }
        $_SESSION['carrinho'][$produto_id] = ($_SESSION['carrinho'][$produto_id] ?? 0) + $quantidade;
        $mensagem_carrinho = 'Produto adicionado ao carrinho.';
    }
}

$prev_page = $numero_pagina > 1 ? $numero_pagina - 1 : null;
$next_page = $numero_pagina < $total_pages ? $numero_pagina + 1 : null;
$query_string = $query ? "q=" . urlencode($query) . "&" : "";
?>

<section class="categorias-section">
    <div class="container">
        <h2 class="section-title">Resultados da Pesquisa</h2>
    </div>
</section>

<section class="produtos-section">
    <div class="container">
        <h2 class="section-title">
            <?= $query !== '' ? 'Pesquisa: "' . htmlspecialchars($query) . '"' : 'Nenhuma pesquisa realizada' ?>
        </h2>

        <?php if ($query !== ''): ?>
            <p class="info-paginacao">
                Encontrados <?= $total_resultados ?> produto<?= $total_resultados !== 1 ? 's' : '' ?>
            </p>

            <?php if ($mensagem_carrinho): ?>
                <div class="alerta-sucesso">
                    <?= htmlspecialchars($mensagem_carrinho) ?>
                </div>
            <?php endif; ?>

            <?php if (!empty($resultados)): ?>
                <div class="produtos-grid">
                    <?php foreach ($resultados as $p): ?>
                        <div class="produto-card">
                            <span class="badge">HEAT</span>
                            <div class="produto-img">
                                <?= obterIconeProduto($p['categoria_id']) ?>
                            </div>
                            <div class="produto-info">
                                <div class="produto-categoria"><?= htmlspecialchars($p['categoria']) ?></div>
                                <div class="produto-nome"><?= htmlspecialchars($p['nome']) ?></div>
                                <div class="produto-preco"><?= number_format($p['preco'], 2) ?></div>
                                <?php if ((int)$p['stock'] > 0): ?>
                                    <form method="POST">
                                        <input type="hidden" name="produto_id" value="<?= $p['id'] ?>">
                                        <input type="hidden" name="quantidade" value="1">
                                        <button type="submit" class="btn-carrinho">Adicionar ao Carrinho</button>
                                    </form>
                                <?php else: ?>
                                    <button class="btn-carrinho" disabled style="opacity:0.5;cursor:not-allowed;">Sem Stock</button>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>

                <div class="paginacao">
                    <?php if ($prev_page): ?>
                        <a href="?<?= $query_string ?>page=<?= $prev_page ?>" class="pag-btn">← Anterior</a>
                    <?php else: ?>
                        <span class="pag-btn desativado">← Anterior</span>
                    <?php endif; ?>

                    <span class="pag-info">Página <?= $numero_pagina ?> de <?= $total_pages ?></span>

                    <?php if ($next_page): ?>
                        <a href="?<?= $query_string ?>page=<?= $next_page ?>" class="pag-btn">Próximo →</a>
                    <?php else: ?>
                        <span class="pag-btn desativado">Próximo →</span>
                    <?php endif; ?>
                </div>
            <?php else: ?>
                <p class="info-paginacao" style="text-align: center; color: var(--text-secondary);">
                    Nenhum produto encontrado para "<?= htmlspecialchars($query) ?>".
                </div>
                <div class="cart-actions" style="justify-content:center;">
                    <a class="btn" href="index.php">Ver todos os produtos</a>
                </div>
            <?php endif; ?>
        <?php else: ?>
            <p class="info-paginacao" style="text-align: center; color: var(--text-secondary);">
                Usa a barra de pesquisa para encontrar produtos.
            </div>
        <?php endif; ?>
    </div>
</section>

<?php include 'rodape.php'; ?>
