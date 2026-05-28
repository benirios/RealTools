<?php
$host = "localhost";
$user = "root";
$password_db = "";
$database = "loja_informatica";

$conn = new mysqli($host, $user, $password_db, $database);

if ($conn->connect_error) {
    die('Erro: ' . $conn->connect_error);
}

echo "<h1>🔧 Corrigir Senha do Admin</h1>";
echo "<hr>";

$password = 'admin';
$new_hash = password_hash($password, PASSWORD_DEFAULT);

echo "<p><strong>Gerando novo hash para senha 'admin'...</strong></p>";
echo "<p>Novo hash: " . htmlspecialchars($new_hash) . "</p>";

$stmt = $conn->prepare("UPDATE utilizadores SET palavra_passe = ? WHERE admin = 1");
$stmt->bind_param("s", $new_hash);

if ($stmt->execute()) {
    echo "<p style='color: green;'><strong>✅ Hash atualizado com sucesso!</strong></p>";

    $stmt2 = $conn->prepare("SELECT palavra_passe FROM utilizadores WHERE admin = 1");
    $stmt2->execute();
    $result = $stmt2->get_result();
    $row = $result->fetch_assoc();

    if (password_verify('admin', $row['palavra_passe'])) {
        echo "<p style='color: green;'><strong>✅ Verificação: Senha 'admin' funciona!</strong></p>";
        echo "<p>Pode fazer login agora em: <a href='/loja/login.php'>http://localhost/loja/login.php</a></p>";
        echo "<p>Email: <strong>admin@admin.com</strong></p>";
        echo "<p>Senha: <strong>admin</strong></p>";
    } else {
        echo "<p style='color: red;'><strong>❌ Erro: Hash ainda não funciona!</strong></p>";
    }
} else {
    echo "<p style='color: red;'><strong>❌ Erro ao atualizar: " . $stmt->error . "</strong></p>";
}

$conn->close();
?>
