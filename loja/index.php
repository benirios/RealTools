<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$numero_pagina = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$numero_pagina = max(1, $numero_pagina);
$id_categoria = isset($_GET['category']) ? (int)$_GET['category'] : null;

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

        $params = [];
        if ($id_categoria) {
            $params[] = 'category=' . $id_categoria;
        }
        if (isset($_GET['page'])) {
            $params[] = 'page=' . (int)$_GET['page'];
        }
        $params[] = 'added=1';
        $query = implode('&', $params);
        header('Location: index.php' . ($query ? '?' . $query : ''));
        exit;
    }
}

if (isset($_GET['added'])) {
    $mensagem_carrinho = 'Produto adicionado ao carrinho.';
}

include 'cabecalho.php';

$produtos_por_pagina = 32;
$numero_pagina = max(1, $numero_pagina);
$offset = ($numero_pagina - 1) * $produtos_por_pagina;

if ($id_categoria) {
    $count_query = "SELECT COUNT(*) as total FROM produtos WHERE categoria_id = ?";
    $stmt_count = $conn->prepare($count_query);
    $stmt_count->bind_param("i", $id_categoria);
} else {
    $count_query = "SELECT COUNT(*) as total FROM produtos";
    $stmt_count = $conn->prepare($count_query);
}
$stmt_count->execute();
$row_count = $stmt_count->get_result()->fetch_assoc();
$total_produtos = $row_count['total'];

$total_pages = ceil($total_produtos / $produtos_por_pagina);
$numero_pagina = min($numero_pagina, max(1, $total_pages));

if ($id_categoria) {
    $products_query = "SELECT p.id, p.nome, p.preco, p.stock, p.categoria_id, c.nome as categoria
                       FROM produtos p
                       JOIN categorias c ON p.categoria_id = c.id
                       WHERE p.categoria_id = ?
                       ORDER BY p.id
                       LIMIT ? OFFSET ?";
    $stmt_products = $conn->prepare($products_query);
    $stmt_products->bind_param("iii", $id_categoria, $produtos_por_pagina, $offset);
} else {
    $products_query = "SELECT p.id, p.nome, p.preco, p.stock, p.categoria_id, c.nome as categoria
                       FROM produtos p
                       JOIN categorias c ON p.categoria_id = c.id
                       ORDER BY p.id
                       LIMIT ? OFFSET ?";
    $stmt_products = $conn->prepare($products_query);
    $stmt_products->bind_param("ii", $produtos_por_pagina, $offset);
}
$stmt_products->execute();
$result_products = $stmt_products->get_result();
$produtos = $result_products->fetch_all(MYSQLI_ASSOC);

$categories_query = "SELECT * FROM categorias ORDER BY nome";
$result_categories = $conn->query($categories_query);
$categorias = $result_categories->fetch_all(MYSQLI_ASSOC);

$query_string = $id_categoria ? "category=$id_categoria&" : "";
$prev_page = $numero_pagina > 1 ? $numero_pagina - 1 : null;
$next_page = $numero_pagina < $total_pages ? $numero_pagina + 1 : null;

?>

<?php if ($id_categoria === null && $numero_pagina === 1): ?>
<section class="container">
    <div class="hero-loja">
        <div>
            <h1>Step Into Heat</h1>
            <p>Jordan, Nike, Adidas, New Balance e mais — drops frescos e clássicos icónicos com envio em Portugal.</p>
        </div>
        <a href="lancamentos.php" class="btn-hero">New Drops</a>
    </div>
</section>
<?php endif; ?>

<section class="categorias-section">
    <div class="container">
        <h2 class="section-title">Categorias</h2>
        <div class="categorias-list">
            <a href="index.php" class="categoria-tag <?= $id_categoria === null ? 'ativa' : '' ?>">
                All Sneakers
            </a>

            <?php foreach ($categorias as $cat): ?>
                <a href="?category=<?= $cat['id'] ?>" 
                   class="categoria-tag <?= $id_categoria === $cat['id'] ? 'ativa' : '' ?>">
                    <?= htmlspecialchars($cat['nome']) ?>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="produtos-section">
    <div class="container">
        <h2 class="section-title">
            <?= $id_categoria ? htmlspecialchars($categorias[array_search($id_categoria, array_column($categorias, 'id'))]['nome'] ?? '') : "All Sneakers" ?>
        </h2>
        
        <!-- Info de paginação (quantos produtos mostrando) -->
        <p class="info-paginacao">
            Mostrando <?= $offset + 1 ?> a <?= min($offset + $produtos_por_pagina, $total_produtos) ?> 
            de <?= $total_produtos ?> produtos
        </p>

        <?php if ($mensagem_carrinho): ?>
            <div class="alerta-sucesso"><?= htmlspecialchars($mensagem_carrinho) ?></div>
        <?php endif; ?>

        <div class="produtos-grid">
            <?php foreach ($produtos as $p): ?>
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
    </div>
</section>

<?php include 'rodape.php'; ?>