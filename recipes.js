const fs = require('fs');
const path = require('path');

function readRecipesFromFile(filename) {
  const fileContent = fs.readFileSync(filename, 'utf-8');
  const lines = fileContent.split('\n');
  const recipes = {};

  let currentTitle = null;
  let currentIngredients = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.length === 0) {
      if (currentTitle) {
        recipes[currentTitle] = currentIngredients ? currentIngredients.split(',') : [];
      }
      currentTitle = null;
      currentIngredients = null;
    } else if (!currentTitle) {
      currentTitle = capitalizeFirstLetter(line);
    } else if (!currentIngredients) {
      currentIngredients = line.toLowerCase();
    }
  }

  if (currentTitle) {
    recipes[currentTitle] = currentIngredients ? currentIngredients.split(',') : [];
  }

  return recipes;
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Example usage
const filename = 'recipes.txt';
const recipes = readRecipesFromFile(filename);
console.log(recipes);



function createRecipeHTML(recipeTitle, recipeIngredients) {
  const folderPath = 'recipes';
  const filename = `${recipeTitle.replace(/ /g, '-')}.html`;
  const filePath = path.join(folderPath, filename);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${recipeTitle}</title>
      <link rel="stylesheet" href="../style.css">
    </head>
    <body>
      <header class="header2">
        <h2><button onclick="window.history.back()">⬅️</button> ${recipeTitle}</h2>
      </header>
      <ul>
        ${recipeIngredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
      </ul>
    </body>
    </html>
  `;

  fs.writeFileSync(filePath, html, 'utf-8');
  console.log(`Created ${filename}`);
  recipeArray += `${filePath.replace(/\\/g, '/')}', '`;

}

function createIndexHTML(recipeTitles) {
  recipeTitles.sort();
  const recipeLinks = recipeTitles.map(title => `<li><a href="recipes/${title.replace(/ /g, '-')}.html">${title}</a></li>`).join('');

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Vegán Receptek</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <header class="header">
      <h1>Vegán Receptek <a href="#" onclick="randomSite();">🎲</a></h1>
    </header>
    <div class=striped-list>
      <ul>
        ${recipeLinks}
      </ul>
    </div>
    <script>
      let recipeArray = ['${recipeArray}'];
      function randomSite() {
          var i = parseInt(Math.random() * recipeArray.length-1);
          location.href = recipeArray[i];
      }
  </script>
  </body>
  </html>
  `;

  fs.writeFileSync('index.html', html, 'utf-8');
  console.log('Created index.html');
}

const recipeTitles = Object.keys(recipes);
/* export  */let recipeArray = [];
for (const recipeTitle in recipes) {
  const recipeIngredients = recipes[recipeTitle];
  createRecipeHTML(recipeTitle, recipeIngredients);
}
module.exports = recipeArray;

createIndexHTML(recipeTitles);
