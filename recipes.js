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
      // Empty line indicates the end of a recipe
      if (currentTitle) {
        recipes[currentTitle] = currentIngredients ? currentIngredients.split(',') : [];
      }
      currentTitle = null;
      currentIngredients = null;
    } else if (!currentTitle) {
      // Line contains the recipe title
      currentTitle = capitalizeFirstLetter(line);
    } else if (!currentIngredients) {
      // Line contains the ingredients
      currentIngredients = line.toLowerCase();
    }
  }

  // Check if there is a recipe left to be added after the loop
  if (currentTitle) {
    recipes[currentTitle] = currentIngredients ? currentIngredients.split(',') : [];
  }

  return recipes;
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Example usage
const filename = 'recipes.txt'; // Replace with the actual file name
const recipes = readRecipesFromFile(filename);
console.log(recipes);



function createRecipeHTML(recipeTitle, recipeIngredients) {
  const folderPath = 'recipes'; // Specify the folder path
  const filename = `${recipeTitle.replace(/ /g, '-')}.html`; // Replace spaces with dashes in the filename
  const filePath = path.join(folderPath, filename);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${recipeTitle}</title>
      <link rel="stylesheet" href="../style.css">
    </head>
    <body>
      <div class="header2">
        <h2><a href="../index.html">⬅️</a>${recipeTitle}</h2>
      </div>
      <ul>
        ${recipeIngredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
      </ul>
    </body>
    </html>
  `;

  fs.writeFileSync(filePath, html, 'utf-8');
  console.log(`Created ${filename}`);
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
      <div class="header">
        <h1>Vegán Receptek</h1>
      </div>
      <div class=links>
        <ul>
          ${recipeLinks}
        </ul>
      </div>
    </body>
    </html>
  `;

  fs.writeFileSync('index.html', html, 'utf-8');
  console.log('Created index.html');
}


const recipeTitles = Object.keys(recipes);

for (const recipeTitle in recipes) {
  const recipeIngredients = recipes[recipeTitle];
  createRecipeHTML(recipeTitle, recipeIngredients);
}

createIndexHTML(recipeTitles);

 