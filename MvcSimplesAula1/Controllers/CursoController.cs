using Microsoft.AspNetCore.Mvc;

namespace MvcSimplesAula1.Controllers
{
    public class CursoController : Controller
    {
        // Parte B + D
        public IActionResult Index()
        {
            ViewData["Mensagem"] = GetMensagemPersonalizada(); // Exercício 4
            ViewData["Data"] = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            return View();
        }

        // Exercício 1
        public IActionResult Sobre()
        {
            return View();
        }

        // Exercício 2
        public IActionResult Ola(string nome)
        {
            ViewData["Nome"] = nome;
            ViewData["Data"] = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            return View();
        }

        // Exercício 3
        public IActionResult Ficha(string nome, int idade)
        {
            ViewData["Nome"] = nome;
            ViewData["Idade"] = idade;
            return View();
        }

        // Exercício 5
        public IActionResult Lista()
        {
            var disciplinas = new List<string>
            {
                "Matemática",
                "Programação Web",
                "Base de Dados",
                "Redes de Computadores",
                "Sistemas Operativos"
            };
            ViewData["Lista"] = disciplinas;
            return View();
        }

        // Desafio Final
        public IActionResult Perfil(string nome, string curso, int ano)
        {
            ViewData["Nome"] = nome;
            ViewData["Curso"] = curso;
            ViewData["Ano"] = ano;
            return View();
        }

        // Exercício 4 – método privado
        private string GetMensagemPersonalizada()
        {
            return "Bem-vindo ao ASP.NET Core MVC!";
        }
    }
}
