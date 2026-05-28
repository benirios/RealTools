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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = trim($_POST['nome'] ?? '');
    $descricao = trim($_POST['descricao'] ?? '');
    $preco = (float)($_POST['preco'] ?? 0);
    $stock = (int)($_POST['stock'] ?? 0);
    $categoria_id = (int)($_POST['categoria_id'] ?? 0);
    $especificacoes_raw = trim($_POST['especificacoes'] ?? '');
    $promocao = isset($_POST['promocao']) ? 1 : 0;
    $imagens = trim($_POST['imagens'] ?? '');

    if ($nome === '' || $preco <= 0 || $categoria_id <= 0) {
        $erro = 'Preenche nome, preco e categoria.';
    } else {
        $especificacoes = $especificacoes_raw === '' ? null : json_encode(['texto' => $especificacoes_raw]);
        $imagens_final = $imagens === '' ? null : $imagens;

        $stmt = $conn->prepare('INSERT INTO produtos (nome, descricao, preco, stock, categoria_id, especificacoes, promocao, imagens) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('ssdiiiss', $nome, $descricao, $preco, $stock, $categoria_id, $especificacoes, $promocao, $imagens_final);

        if ($stmt->execute()) {
            $sucesso = 'Produto inserido com sucesso!';
        } else {
            $erro = 'Erro ao inserir produto.';
        }
    }
}

$cats = $conn->query('SELECT id, nome FROM categorias ORDER BY nome');
?>

<style>
.admin-secao{display:flex;justify-content:center;padding:3rem 1rem}
.admin-card{background:var(--bg-secondary);border-radius:14px;padding:2.5rem 2rem;width:100%;max-width:600px;border-top:4px solid var(--accent);box-shadow:0 6px 30px var(--shadow)}
.admin-card h2{text-align:center;margin-bottom:6px;color:var(--text-primary)}
.admin-card .sub{text-align:center;font-size:.9rem;color:var(--text-secondary);margin-bottom:1.6rem}
.admin-card label{display:block;text-align:left;font-size:.78rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.35rem}
.admin-card input,.admin-card textarea,.admin-card select{width:100%;background:var(--bg-primary);border:1.5px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:.9rem;padding:0 1rem;outline:none;margin-bottom:1.2rem;transition:border-color .2s}
.admin-card input,.admin-card select{height:44px}
.admin-card textarea{padding-top:.8rem;resize:vertical}
.admin-card input:focus,.admin-card textarea:focus,.admin-card select:focus{border-color:var(--accent)}
.btn-admin{width:100%;height:46px;background:var(--accent);color:var(--bg-primary);font-size:1rem;font-weight:700;border:none;border-radius:8px;cursor:pointer;transition:filter .2s}
.btn-admin:hover{filter:brightness(1.05)}
.msg-erro{background:rgba(220,50,50,.12);color:#ef4444;border:1px solid rgba(220,50,50,.3);border-radius:8px;padding:.6rem .9rem;font-size:.85rem;margin-bottom:1.1rem;text-align:center}
.msg-sucesso{background:rgba(34,197,94,.12);color:#22c55e;border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:.7rem .9rem;font-size:.88rem;margin-bottom:1.1rem;text-align:center}
.checkbox-line{display:flex;align-items:center;gap:10px;color:var(--text-secondary);font-size:.9rem;margin-bottom:1.2rem}
.checkbox-line input{width:18px;height:18px;margin:0;accent-color:var(--accent)}
</style>

<section class="admin-secao">
    <div class="admin-card">
        <h2>Inserir Produto</h2>
        <p class="sub">Adicionar novos produtos ao catalogo</p>

        <?php if ($erro): ?>
            <div class="msg-erro">⚠ <?= htmlspecialchars($erro) ?></div>
        <?php endif; ?>
        <?php if ($sucesso): ?>
            <div class="msg-sucesso">✓ <?= htmlspecialchars($sucesso) ?></div>
        <?php endif; ?>

        <form method="POST">
            <label for="nome">Nome</label>
            <input type="text" id="nome" name="nome" placeholder="Ex: Portatil Gaming" required>

            <label for="descricao">Descricao</label>
            <textarea id="descricao" name="descricao" rows="3" placeholder="Descricao do produto"></textarea>

            <label for="preco">Preco (EUR)</label>
            <input type="number" id="preco" name="preco" step="0.01" min="0" placeholder="Ex: 999.99" required>

            <label for="stock">Stock</label>
            <input type="number" id="stock" name="stock" min="0" placeholder="Ex: 10" value="0">

            <label for="categoria_id">Categoria</label>
            <select id="categoria_id" name="categoria_id" required>
                <option value="">-- Selecionar categoria --</option>
                <?php if ($cats): ?>
                    <?php while ($cat = $cats->fetch_assoc()): ?>
                        <option value="<?= $cat['id'] ?>"><?= htmlspecialchars($cat['nome']) ?></option>
                    <?php endwhile; ?>
                <?php endif; ?>
            </select>

            <label for="especificacoes">Especificacoes (texto)</label>
            <textarea id="especificacoes" name="especificacoes" rows="3" placeholder="Ex: RAM 16GB, SSD 512GB"></textarea>

            <label for="imagens">Imagem (caminho)</label>
            <input type="text" id="imagens" name="imagens" placeholder="Ex: imagens/produto.png">

            <div class="checkbox-line">
                <input type="checkbox" id="promocao" name="promocao">
                <label for="promocao">Em promocao</label>
            </div>

            <button type="submit" class="btn-admin">Inserir Produto</button>
        </form>
    </div>
</section>

<?php include '../rodape.php'; ?>
