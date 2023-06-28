const fs = require('fs');
const path = require('path');

function readRecipesFromFile(filename) {
  const fileContent = fs.readFileSync(filename, 'utf-8');
  const lines = fileContent.split('\n');
  const recipes = {};

  let currentTitle = null;
  let currentIngredients = null;
  let currentTags = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.length === 0) {
      if (currentTitle) {
        recipes[currentTitle] = {
          ingredients: currentIngredients ? currentIngredients.split(',') : [],
          tags: currentTags
        };
      }
      currentTitle = null;
      currentIngredients = null;
      currentTags = [];
    } else if (!currentTitle) {
      currentTitle = capitalizeFirstLetter(line);
    } else if (!currentIngredients && !currentTags.length) {
      if (line.startsWith('#')) {
        const tagsLine = line.slice(1).replace(/\s/g, '');
        currentTags = tagsLine.split(',');
      } else {
        currentIngredients = line.toLowerCase();
      }
    } else if (currentIngredients && !currentTags.length) {
      if (line.startsWith('#')) {
        const tagsLine = line.slice(1).replace(/\s/g, '');
        currentTags = tagsLine.split(',');
      } else {
        currentIngredients += ',' + line.toLowerCase();
      }
    } else if (currentIngredients && currentTags.length) {
      if (line.startsWith('#')) {
        const tagsLine = line.slice(1).replace(/\s/g, '');
        currentTags = currentTags.concat(tagsLine.split(','));
      } else {
        currentIngredients += ',' + line.toLowerCase();
      }
    }
  }

  if (currentTitle) {
    recipes[currentTitle] = {
      ingredients: currentIngredients ? currentIngredients.split(',') : [],
      tags: currentTags
    };
  }

  return recipes;
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const filename = 'recipes.txt';
const recipes = readRecipesFromFile(filename);
console.log(recipes);

function createRecipeHTML(recipeTitle, recipeIngredients, recipeTags) {
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
        <h2><a href="../index.html">🏠</a><button onclick="window.history.back()">⬅️</button> ${recipeTitle}</h2>
      </header>
      <ul>
        ${recipeIngredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
      </ul>
      <br>
      <div class="tags">
        ${recipeTags.map(tag => `<span class="tag"><a href="../tag.html#${tag}">#${tag}</a></span>`).join(' ')}
      </div>
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
      <h1><a href="tag.html">#️⃣</a> Vegán Receptek <a href="#" onclick="randomSite();">🎲</a></h1>
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

function createTagHTML(recipeTitles) {
  recipeTitles.sort();
  const allTags = [];
  for (const recipeTitle in recipes) {
    const recipeTags = recipes[recipeTitle].tags;
    allTags.push(...recipeTags);
  }

  const uniqueTags = Array.from(new Set(allTags)).sort();

  const tagSections = uniqueTags.map(tag => {
    const taggedRecipes = recipeTitles.filter(title => recipes[title].tags.includes(tag));
    const recipeLinks = taggedRecipes.map(title => `<li><a href="recipes/${title.replace(/ /g, '-')}.html">${title}</a></li>`).join('');
    return `<section id="${tag}"><h3>#${tag}</h3><ul>${recipeLinks}</ul></section>`;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tagek</title>
      <link rel="stylesheet" href="style.css">
    </head>
    <body>
      <header class="header2">
      <h2><a href="index.html">🏠</a><button onclick="window.history.back()">⬅️</button> Tagek</h2>
      </header>
      <div class="tag-list">
        ${tagSections}
      </div>
    </body>
    </html>
  `;

  fs.writeFileSync('tag.html', html, 'utf-8');
  console.log('Created tag.html');
}



const recipeTitles = Object.keys(recipes);
let recipeArray = [];
for (const recipeTitle in recipes) {
  const recipeIngredients = recipes[recipeTitle].ingredients;
  const recipeTags = recipes[recipeTitle].tags;
  createRecipeHTML(recipeTitle, recipeIngredients, recipeTags);
}

createIndexHTML(recipeTitles);
createTagHTML(recipeTitles);
