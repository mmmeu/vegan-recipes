const fs = require('fs-extra');
const path = require('path');

function readRecipesFromFile(filename) {
  const fileContent = fs.readFileSync(filename, 'utf-8');
  const lines = fileContent.split('\n');
  const recipes = {};

  let currentRecipe = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.length === 0) {
      if (currentRecipe) {
        recipes[currentRecipe.title] = currentRecipe;
        currentRecipe = null;
      }
    } else if (!currentRecipe) {
      const [title, ...rest] = line.split(',');
      currentRecipe = {
        title: capitalizeFirstLetter(title.trim()),
        ingredients: [],
        tags: [],
        links: [],
        comments: [],
      };

      let currentSection = 'ingredients';
      rest.forEach(item => {
        if (item.startsWith('#')) {
          currentSection = 'tags';
        } else if (item.startsWith('http')) {
          currentSection = 'links';
        } else if (item.startsWith('**')) {
          currentSection = 'comments';
        } else {
          if (currentSection === 'ingredients') {
            const ingredients = item.split(',').map(ingredient => ingredient.trim().toLowerCase());
            currentRecipe.ingredients.push(...ingredients);
          } else {
            currentRecipe[currentSection].push(item.trim());
          }
        }
      });
    } else {
      if (line.startsWith('#')) {
        currentRecipe.tags.push(...line.slice(1).replace(/\s/g, '').split(','));
      } else if (line.startsWith('http')) {
        currentRecipe.links.push(line);
      } else if (line.startsWith('**')) {
        currentRecipe.comments.push(line.slice(2).trim());
      } else {
        const ingredients = line.split(',').map(ingredient => ingredient.trim().toLowerCase());
        currentRecipe.ingredients.push(...ingredients);
      }
    }
  }

  if (currentRecipe) {
    recipes[currentRecipe.title] = currentRecipe;
  }

  return recipes;
}


function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const filename = 'recipes.txt';
const recipes = readRecipesFromFile(filename);
console.log(recipes);

const folderPath = 'recipes';

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}
else if (fs.existsSync(folderPath)) {
  fs.emptyDirSync(folderPath);
}

function createRecipeHTML(recipeTitle, recipeIngredients, recipeTags, recipeLinks, recipeComment) {
  const filename = `${recipeTitle.replace(/ /g, '-')}.html`;
  const filePath = path.join(folderPath, filename);
  const hasIngredients = recipeIngredients && recipeIngredients.length > 0;
  const hasLinks = recipeLinks && recipeLinks.length > 0;
  const hasComments = recipeComment && recipeComment.length > 0;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${recipeTitle}</title>
      <link rel="stylesheet" href="../style.css">
    </head>
    <body>
      <header class="header2">
        <h2><a href="../index.html">🏠</a> ${recipeTitle}</h2>
      </header>
      ${hasIngredients ? '<ul>' : ''}
        ${hasIngredients ? recipeIngredients.map(ingredient => `<li>${ingredient}</li>`).join('') : ''}
      ${hasIngredients ? '</ul>' : ''}
      
      ${hasLinks ? '<div class="links">' : ''}
        ${hasLinks ? '<ol>' : ''}
          ${hasLinks ? recipeLinks.map(link => `<li><a href="${link}" target="_blank">link</a></li>`).join('') : ''}
        ${hasLinks ? '</ol>' : ''}
      ${hasLinks ? '</div>' : ''}
      
      ${hasComments ? '<div class="comments">' : ''}
        ${hasComments ? '<ul>' : ''}
          ${hasComments ? recipeComment.map(comment => `<li>${comment}</li>`).join('') : ''}
        ${hasComments ? '</ul>' : ''}
      ${hasComments ? '</div>' : ''}
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
  recipeTitles.sort((a, b) => a.localeCompare(b, 'hu-HU'));
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
  recipeTitles.sort((a, b) => a.localeCompare(b, 'hu-HU'));
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
      <h2><a href="index.html">🏠</a> Címkék</h2>
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
  const recipeLinks = recipes[recipeTitle].links;
  const recipeComments = recipes[recipeTitle].comments;
  createRecipeHTML(recipeTitle, recipeIngredients, recipeTags, recipeLinks, recipeComments);
}

createIndexHTML(recipeTitles);
createTagHTML(recipeTitles);
