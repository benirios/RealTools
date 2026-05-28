<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$host = "127.0.0.1";
$user = "root";
$password = "";
$database = "loja_informatica";

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die('Erro de ligação: ' . $conn->connect_error);
}

$ficheiro_atual = basename($_SERVER['PHP_SELF']);
$area_admin = strpos($_SERVER['PHP_SELF'], '/administrador/') !== false;
$prefixo_raiz = $area_admin ? '../' : '';

$sessao_ativa = isset($_SESSION['id']);
$nome_utilizador = $_SESSION['nome'] ?? '';
$utilizador_admin = (int)($_SESSION['admin'] ?? 0) === 1;

$itens_no_carrinho = 0;
if (isset($_SESSION['carrinho']) && is_array($_SESSION['carrinho'])) {
    $itens_no_carrinho = array_sum(array_map('intval', $_SESSION['carrinho']));
}

function obterIconeProduto($categoria_id) {
    $sapatilha = '<svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 52 C18 38 32 28 52 26 L68 22 C78 20 88 24 94 32 L104 48 C108 54 106 58 98 58 L28 58 C18 58 10 56 12 52Z" fill="var(--cor-superficie-alt)" stroke="var(--cor-texto)" stroke-width="1.8"/>
        <path d="M52 26 L72 30 L88 38" stroke="var(--cor-destaque)" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="38" cy="54" rx="10" ry="5" fill="var(--cor-destaque)" opacity="0.35"/>
        <path d="M22 50 L42 44 L58 42 L78 46" stroke="var(--cor-texto)" stroke-width="1.2" opacity="0.5"/>
        <circle cx="92" cy="40" r="3" fill="var(--cor-destaque)"/>
    </svg>';
    $variantes = [
        1 => str_replace('opacity="0.35"', 'opacity="0.5"', $sapatilha),
        2 => str_replace('var(--cor-destaque)', '#22c55e', $sapatilha),
        3 => str_replace('var(--cor-destaque)', '#a855f7', $sapatilha),
        4 => str_replace('var(--cor-destaque)', '#f59e0b', $sapatilha),
        5 => str_replace('var(--cor-destaque)', '#3b82f6', $sapatilha),
    ];
    return $variantes[$categoria_id] ?? $sapatilha;
}
?>


<!DOCTYPE html>
<html lang="pt" data-theme="light">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SoleDrop — Sneaker Store</title>
    <link rel="stylesheet" href="<?= $prefixo_raiz ?>assets/loja.css">
</head>

<body>

    <header class="site-header">
        <div class="header-inner">
            <a href="<?= $prefixo_raiz ?>index.php" class="logo">
                <span class="logo-mark">SD</span>
                SoleDrop
            </a>
            <form class="search-bar" action="<?= $prefixo_raiz ?>pesquisa.php" method="GET">
                <input type="text" name="q" placeholder="Pesquisar sapatilhas..." required>
                <button type="submit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </button>
            </form>
            <div class="header-actions">
                <button class="theme-toggle" id="themeToggle" aria-label="Alternar tema">
                    <svg id="sunIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: block;">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    <svg id="moonIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                </button>
                <a href="<?= $prefixo_raiz ?>carrinho.php" class="header-cart">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <span class="header-cart-count"><?= $itens_no_carrinho ?></span>
                </a>
            </div>
        </div>
    </header>

    <nav class="site-nav">
        <div class="nav-inner">
            <ul>
                <li>
                    <a href="<?= $prefixo_raiz ?>index.php" class="<?= !$area_admin && $ficheiro_atual === 'index.php' ? 'ativo' : '' ?>">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        Inicio
                    </a>
                </li>
                <li>
                    <a href="<?= $prefixo_raiz ?>portateis.php" class="<?= !$area_admin && $ficheiro_atual === 'portateis.php' ? 'ativo' : '' ?>">
                        Lifestyle
                    </a>
                </li>
                <li>
                    <a href="<?= $prefixo_raiz ?>gaming.php" class="<?= !$area_admin && $ficheiro_atual === 'gaming.php' ? 'ativo' : '' ?>">
                        Running
                    </a>
                </li>
                <li>
                    <a href="<?= $prefixo_raiz ?>lancamentos.php" class="<?= !$area_admin && $ficheiro_atual === 'lancamentos.php' ? 'ativo' : '' ?>">
                        New Drops
                    </a>
                </li>
                <li>
                    <a href="<?= $prefixo_raiz ?>componentes.php" class="<?= !$area_admin && $ficheiro_atual === 'componentes.php' ? 'ativo' : '' ?>">
                        Basketball
                    </a>
                </li>
                <li>
                    <a href="<?= $prefixo_raiz ?>perifericos.php" class="<?= !$area_admin && $ficheiro_atual === 'perifericos.php' ? 'ativo' : '' ?>">
                        Skate
                    </a>
                </li>
                <li>
                    <a href="<?= $prefixo_raiz ?>promocoes.php" class="<?= !$area_admin && $ficheiro_atual === 'promocoes.php' ? 'ativo' : '' ?>">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                        </svg>
                        Promocoes
                    </a>
                </li>
                <li>
                    <a href="<?= $prefixo_raiz ?>contactos.php" class="<?= !$area_admin && $ficheiro_atual === 'contactos.php' ? 'ativo' : '' ?>">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Contactos
                    </a>
                </li>
                <?php if ($utilizador_admin): ?>
                <li>
                    <a href="<?= $prefixo_raiz ?>administrador/index.php" class="<?= $ficheiro_atual === 'index.php' && $area_admin ? 'ativo' : '' ?>">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="7" r="4"></circle>
                            <path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path>
                        </svg>
                        Admin
                    </a>
                </li>
                <?php endif; ?>
                <li>
                    <a href="<?= $prefixo_raiz ?>login.php" class="<?= !$area_admin && $ficheiro_atual === 'login.php' ? 'ativo' : '' ?>">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                        <?= $sessao_ativa ? 'Conta' : 'Entrar' ?>
                    </a>
                </li>
                <?php if ($sessao_ativa): ?>
                <li>
                    <a href="<?= $prefixo_raiz ?>login.php?logout=1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Sair
                    </a>
                </li>
                <?php endif; ?>
            </ul>
        </div>
    </nav>

    <div class="faixa-promo">
        Envio grátis acima de <strong>€75</strong> · Sapatilhas 100% autênticas · Novos drops todas as semanas
    </div>

    <main>
        <div class="container">