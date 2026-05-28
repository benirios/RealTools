-- SoleDrop sneaker store seed (updates existing loja_informatica data)

UPDATE categorias SET nome = 'Lifestyle' WHERE id = 1;
UPDATE categorias SET nome = 'Running' WHERE id = 2;
UPDATE categorias SET nome = 'New Drops' WHERE id = 3;
UPDATE categorias SET nome = 'Basketball' WHERE id = 4;
UPDATE categorias SET nome = 'Skate' WHERE id = 5;

UPDATE produtos SET nome = 'Nike Air Force 1 ''07', descricao = 'O clássico branco que nunca sai de moda. Cabedal em pele e sola Air.', preco = 109.99, promocao = 1 WHERE id = 1;
UPDATE produtos SET nome = 'Adidas Stan Smith', descricao = 'Ícone minimalista com perfurado verde. Estilo limpo para o dia a dia.', preco = 99.99, promocao = 0 WHERE id = 2;
UPDATE produtos SET nome = 'Converse Chuck 70 High', descricao = 'Canvas premium e sola de borracha vulcanizada. Edição Chuck 70.', preco = 84.99, promocao = 0 WHERE id = 3;
UPDATE produtos SET nome = 'New Balance 550', descricao = 'Silhueta retro de basquetebol reborn. Combinações vintage.', preco = 119.99, promocao = 0 WHERE id = 4;
UPDATE produtos SET nome = 'Puma Suede Classic', descricao = 'Camurça icónica desde os anos 60. Streetwear essencial.', preco = 79.99, promocao = 1 WHERE id = 5;

UPDATE produtos SET nome = 'Nike Air Zoom Pegasus 41', descricao = 'Amortecimento React e Zoom Air. O daily runner mais popular.', preco = 139.99, promocao = 1 WHERE id = 6;
UPDATE produtos SET nome = 'Adidas Ultraboost Light', descricao = 'Boost leve e upper Primeknit. Conforto máximo em cada passo.', preco = 189.99, promocao = 0 WHERE id = 7;
UPDATE produtos SET nome = 'Asics Gel-Nimbus 26', descricao = 'Gel cushioning e FF Blast+. Feito para longas distâncias.', preco = 169.99, promocao = 0 WHERE id = 8;
UPDATE produtos SET nome = 'New Balance Fresh Foam X 1080v13', descricao = 'Fresh Foam X e upper Hypoknit. Corrida suave e estável.', preco = 164.99, promocao = 1 WHERE id = 9;
UPDATE produtos SET nome = 'Hoka Clifton 9', descricao = 'Meta-Rocker e espuma compressiva. Leveza para corridas fáceis.', preco = 144.99, promocao = 0 WHERE id = 10;

UPDATE produtos SET nome = 'Air Jordan 1 Retro High OG', descricao = 'Silhueta que mudou o jogo. Cabedal em pele e Swoosh icónico.', preco = 179.99, promocao = 1 WHERE id = 11;
UPDATE produtos SET nome = 'Nike Dunk Low Retro', descricao = 'Skateboarding heritage com estética college. Cores OG.', preco = 119.99, promocao = 0 WHERE id = 12;
UPDATE produtos SET nome = 'adidas Yeezy Boost 350 V2', descricao = 'Primeknit upper e full-length Boost. Silhueta reconhecível.', preco = 229.99, promocao = 0 WHERE id = 13;
UPDATE produtos SET nome = 'New Balance 1906R', descricao = 'Tecnologia N-ergy e ABZORB SBS. Runner Y2K aesthetic.', preco = 149.99, promocao = 1 WHERE id = 14;
UPDATE produtos SET nome = 'Nike Air Max 1', descricao = 'A primeira Air Max visível. Design Tinker Hatfield.', preco = 139.99, promocao = 0 WHERE id = 15;

UPDATE produtos SET nome = 'Air Jordan 4 Retro', descricao = 'Mesh panels e wings laterais. Um dos Jordan mais desejados.', preco = 209.99, promocao = 1 WHERE id = 16;
UPDATE produtos SET nome = 'Nike LeBron 21', descricao = 'Zoom Air e suporte para jogadores explosivos. Domina o court.', preco = 199.99, promocao = 0 WHERE id = 17;
UPDATE produtos SET nome = 'Adidas Harden Vol. 8', descricao = 'Tração BOOST e estabilidade lateral. Assinatura James Harden.', preco = 159.99, promocao = 1 WHERE id = 18;
UPDATE produtos SET nome = 'Under Armour Curry 11', descricao = 'Flow cushioning sem borracha. Velocidade de Stephen Curry.', preco = 169.99, promocao = 0 WHERE id = 19;
UPDATE produtos SET nome = 'Puma MB.03', descricao = 'Assinatura LaMelo Ball. Design futurista e grip agressivo.', preco = 129.99, promocao = 0 WHERE id = 20;

UPDATE produtos SET nome = 'Nike SB Dunk Low Pro', descricao = 'Zoom Air no heel e suede resistente. Feito para skate.', preco = 109.99, promocao = 1 WHERE id = 21;
UPDATE produtos SET nome = 'Vans Old Skool Pro', descricao = 'Suede/canvas com waffle sole. O stripe lateral clássico.', preco = 74.99, promocao = 0 WHERE id = 22;
UPDATE produtos SET nome = 'Converse CONS Louie Lopez Pro', descricao = 'Assinatura Louie Lopez. Durabilidade para sessões longas.', preco = 79.99, promocao = 1 WHERE id = 23;
UPDATE produtos SET nome = 'Adidas Busenitz Pro', descricao = 'Cupsole vulcanizada inspirada em futebol. Controlo e feel.', preco = 89.99, promocao = 0 WHERE id = 24;
UPDATE produtos SET nome = 'New Balance Numeric 306', descricao = 'FUELCELL foam e upper em mesh. Pro model NB Numeric.', preco = 94.99, promocao = 1 WHERE id = 25;
UPDATE produtos SET nome = 'DC Shoes Metric S', descricao = 'Super Suede e ventilation holes. Estilo anos 90 reborn.', preco = 84.99, promocao = 0 WHERE id = 26;
