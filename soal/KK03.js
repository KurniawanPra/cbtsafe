// ============================================================
// PAKET SOAL KK03 – PHP, Laravel & Web Development (English)
// Grade 11, Second Semester – Mid-Term Exam (UTS)
// ============================================================
const PAKET = {
    kode: "KK03",
    nama: "KK03 – PHP, Laravel & Web Development",
    deskripsi: "Competency test on PHP programming, Laravel framework, and web development concepts. Conducted in English.",
    durasi: 90,
    jumlahPG: 40,
    jumlahEssay: 5,

    soalPG: [
        // — PHP FUNDAMENTALS —
        { id: 1,  pertanyaan: "Which of the following is the correct way to open a PHP code block?", opsi: ["&lt;php&gt;", "&lt;? php &gt;", "&lt;?php", "&lt;/php&gt;"], jawaban: 2 },
        { id: 2,  pertanyaan: "In PHP, all variable names must start with which symbol?", opsi: ["#", "@", "&amp;", "$"], jawaban: 3 },
        { id: 3,  pertanyaan: "Which PHP statement is used to print output to the browser?", opsi: ["print_line()", "console.log()", "echo", "output()"], jawaban: 2 },
        { id: 4,  pertanyaan: "What is the correct way to declare a single-line comment in PHP?", opsi: ["&lt;!-- comment --&gt;", "/* comment */", "// comment", "## comment"], jawaban: 2 },
        { id: 5,  pertanyaan: "Which PHP superglobal variable is used to collect form data sent via POST method?", opsi: ["$_GET", "$_FORM", "$_POST", "$_DATA"], jawaban: 2 },
        { id: 6,  pertanyaan: "What will the following code output? &lt;?php echo 10 % 3; ?&gt;", opsi: ["3", "1", "0", "3.33"], jawaban: 1 },
        { id: 7,  pertanyaan: "Which PHP function is used to check if a variable has been set and is not NULL?", opsi: ["is_null()", "empty()", "isset()", "defined()"], jawaban: 2 },
        { id: 8,  pertanyaan: "The PHP string concatenation operator is…", opsi: ["+", ".", "*", "&amp;&amp;"], jawaban: 1 },
        { id: 9,  pertanyaan: "Which PHP function returns the number of characters in a string?", opsi: ["count()", "size()", "length()", "strlen()"], jawaban: 3 },
        { id: 10, pertanyaan: "Which PHP loop is best suited for iterating over all elements of an array?", opsi: ["for", "while", "do...while", "foreach"], jawaban: 3 },

        // — PHP ARRAYS & FUNCTIONS —
        { id: 11, pertanyaan: "Which PHP function counts the number of elements in an array?", opsi: ["strlen()", "size()", "count()", "total()"], jawaban: 2 },
        { id: 12, pertanyaan: "What does the PHP function array_push() do?", opsi: ["Removes the last element from an array", "Adds one or more elements to the end of an array", "Sorts the array in ascending order", "Reverses the array order"], jawaban: 1 },
        { id: 13, pertanyaan: "Which PHP function converts a string to all uppercase letters?", opsi: ["toUpper()", "uppercase()", "strtoupper()", "str_upper()"], jawaban: 2 },
        { id: 14, pertanyaan: "In PHP, what is the difference between include() and require()?", opsi: ["They are identical; there is no difference", "require() causes a fatal error if file not found; include() only gives a warning", "include() causes a fatal error if file not found; require() only gives a warning", "require() works for HTML only; include() works for PHP only"], jawaban: 1 },
        { id: 15, pertanyaan: "What is the output of: &lt;?php $arr = [1,2,3]; echo count($arr); ?&gt;", opsi: ["1", "2", "3", "6"], jawaban: 2 },

        // — PHP OOP —
        { id: 16, pertanyaan: "In PHP Object-Oriented Programming, which keyword is used to define a class?", opsi: ["object", "define", "class", "new"], jawaban: 2 },
        { id: 17, pertanyaan: "Which PHP keyword is used to create an instance (object) of a class?", opsi: ["create", "object", "instance", "new"], jawaban: 3 },
        { id: 18, pertanyaan: "In PHP OOP, what is the purpose of the __construct() method?", opsi: ["It is called when an object is destroyed", "It is called automatically when a new object is created (constructor)", "It formats the output of an object", "It converts the object to a string"], jawaban: 1 },
        { id: 19, pertanyaan: "Which OOP concept allows a child class to inherit properties and methods from a parent class?", opsi: ["Encapsulation", "Polymorphism", "Abstraction", "Inheritance"], jawaban: 3 },
        { id: 20, pertanyaan: "In PHP, which visibility keyword makes a property or method accessible ONLY within its own class?", opsi: ["public", "protected", "private", "internal"], jawaban: 2 },

        // — PHP SESSION & FORM —
        { id: 21, pertanyaan: "Which PHP function must be called at the beginning of a script to start using sessions?", opsi: ["session_open()", "session_init()", "start_session()", "session_start()"], jawaban: 3 },
        { id: 22, pertanyaan: "How do you store a value in a PHP session variable?", opsi: ["session('key') = 'value'", "$_SESSION['key'] = 'value'", "$SESSION->key = 'value'", "set_session('key', 'value')"], jawaban: 1 },
        { id: 23, pertanyaan: "Which PHP function is commonly used to prevent SQL Injection when using MySQLi?", opsi: ["mysql_escape()", "htmlspecialchars()", "mysqli_real_escape_string()", "strip_tags()"], jawaban: 2 },
        { id: 24, pertanyaan: "What does the PHP function htmlspecialchars() do?", opsi: ["Converts HTML entities to characters", "Converts special characters to HTML entities to prevent XSS attacks", "Removes all HTML tags from a string", "Formats a string as HTML"], jawaban: 1 },

        // — LARAVEL FUNDAMENTALS —
        { id: 25, pertanyaan: "Laravel is a PHP framework that follows which architectural pattern?", opsi: ["MVP (Model-View-Presenter)", "MVVM (Model-View-ViewModel)", "MVC (Model-View-Controller)", "Singleton Pattern"], jawaban: 2 },
        { id: 26, pertanyaan: "In Laravel, which folder contains route definitions for web applications?", opsi: ["app/routes.php", "config/routes.php", "routes/web.php", "public/routes.php"], jawaban: 2 },
        { id: 27, pertanyaan: "Which Artisan command is used to create a new Laravel controller?", opsi: ["php artisan new:controller NamaController", "php artisan create controller NamaController", "php artisan make:controller NamaController", "php artisan generate:controller NamaController"], jawaban: 2 },
        { id: 28, pertanyaan: "In Laravel, the 'php artisan serve' command is used to…", opsi: ["Deploy the application to a server", "Create a new project", "Start a built-in development server on localhost:8000", "Clear the application cache"], jawaban: 2 },
        { id: 29, pertanyaan: "Laravel's built-in templating engine is called…", opsi: ["Twig", "Smarty", "Mustache", "Blade"], jawaban: 3 },
        { id: 30, pertanyaan: "In a Blade template, how do you display a PHP variable $name safely (with HTML escaping)?", opsi: ["&lt;?= $name ?&gt;", "{{ $name }}", "{!! $name !!}", "&lt;?php echo $name; ?&gt;"], jawaban: 1 },
        { id: 31, pertanyaan: "In Blade, how do you output a variable WITHOUT HTML escaping (raw output)?", opsi: ["{{ $variable }}", "{{{ $variable }}}", "{!! $variable !!}", "&lt;?raw $variable ?&gt;"], jawaban: 2 },
        { id: 32, pertanyaan: "Which Artisan command is used to create a new database migration file in Laravel?", opsi: ["php artisan create:migration create_users_table", "php artisan make:migration create_users_table", "php artisan new:migration create_users_table", "php artisan db:migration create_users_table"], jawaban: 1 },
        { id: 33, pertanyaan: "Which Artisan command runs all pending migration files to create the database tables?", opsi: ["php artisan db:run", "php artisan migrate:up", "php artisan migrate", "php artisan db:create"], jawaban: 2 },

        // — LARAVEL ELOQUENT & MVC —
        { id: 34, pertanyaan: "In Laravel, Eloquent ORM is used to…", opsi: ["Manage CSS styling", "Interact with the database using PHP objects instead of writing raw SQL queries", "Handle user authentication only", "Compile JavaScript assets"], jawaban: 1 },
        { id: 35, pertanyaan: "In Laravel's MVC pattern, which component is responsible for handling business logic and database interaction?", opsi: ["View", "Controller", "Model", "Middleware"], jawaban: 2 },
        { id: 36, pertanyaan: "In Laravel's MVC pattern, the View is responsible for…", opsi: ["Handling HTTP requests and responses", "Communicating with the database", "Displaying data to the user (UI/presentation layer)", "Routing requests to controllers"], jawaban: 2 },
        { id: 37, pertanyaan: "Which Artisan command is used to create a new Eloquent Model in Laravel?", opsi: ["php artisan make:model Post", "php artisan create:model Post", "php artisan generate:model Post", "php artisan new:model Post"], jawaban: 0 },
        { id: 38, pertanyaan: "In Laravel Eloquent, which method retrieves ALL records from a table?", opsi: ["Post::find()", "Post::first()", "Post::all()", "Post::get()"], jawaban: 2 },

        // — LARAVEL ROUTING & MIDDLEWARE —
        { id: 39, pertanyaan: "In Laravel, which method in routes/web.php handles a GET request to '/' and calls a view named 'home'?", opsi: ["Route::post('/', function() { return view('home'); })", "Route::get('/', function() { return view('home'); })", "Route::fetch('/', 'home.view')", "Route::url('/', view('home'))"], jawaban: 1 },
        { id: 40, pertanyaan: "In Laravel, Middleware is used to…", opsi: ["Define database table structures", "Filter HTTP requests entering the application (e.g., authentication checks)", "Create Blade template files", "Generate migration files"], jawaban: 1 }
    ],

    soalEssay: [
        { id: 41, pertanyaan: "Explain the MVC (Model-View-Controller) architecture pattern in Laravel! Describe the role of each component (Model, View, Controller) and explain how they interact with each other when a user submits a form. Provide a simple example using a student data management scenario." },
        { id: 42, pertanyaan: "What is Eloquent ORM in Laravel? Explain the advantages of using Eloquent ORM compared to writing raw SQL queries. Write Eloquent code examples to perform the following operations on a 'Student' model: (a) Get all students, (b) Find a student by ID, (c) Create a new student record, (d) Update a student's email, (e) Delete a student record." },
        { id: 43, pertanyaan: "Explain the concept of Laravel Migrations. What is the purpose of migrations in a Laravel project? Write a migration file structure to create a 'products' table with the following columns: id (auto increment), name (string, max 100), price (decimal), stock (integer), category_id (foreign key), and timestamps. Also, write the Artisan commands to run and roll back the migration." },
        { id: 44, pertanyaan: "Explain the difference between GET and POST HTTP methods in web development! When should you use GET vs POST? In a Laravel route file, write examples of GET and POST routes for a student registration system that: (a) displays a registration form, and (b) processes the submitted form data and saves it to the database using Eloquent." },
        { id: 45, pertanyaan: "What is Laravel Blade templating? Explain the following Blade directives with examples: @extends, @section, @yield, @include, @foreach, @if, @auth. Create a simple Blade layout file (layout.blade.php) and a child view (dashboard.blade.php) that extends the layout and displays a list of students using @foreach." }
    ]
};
