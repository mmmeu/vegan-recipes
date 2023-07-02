const fs = require('fs-extra');
const path = require('path');

function readRecipesFromFile(filename) {
  const fileContent = fs.readFileSync(filename, 'utf-8');
  const lines = fileContent.split('\n');
  const recipes = {};

  let currentTitle = null;
  let currentContent = null;
  let currentTags = [];
  let currentLinks = [];
  let currentComments = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('**')) {
      currentComments.push(line.slice(2).trim());
    } else if (line.length === 0) {
      if (currentTitle) {
        recipes[currentTitle] = {
          ingredients: currentContent ? currentContent.split(',') : [],
          tags: currentTags,
          links: currentLinks,
          comments: currentComments
        };
      }
      currentTitle = null;
      currentContent = null;
      currentTags = [];
      currentLinks = [];
      currentComments = [];
    } else if (!currentTitle) {
      currentTitle = capitalizeFirstLetter(line);
    } else if (!currentContent) {
      if (line.startsWith('#')) {
        const tagsLine = line.slice(1).replace(/\s/g, '');
        currentTags = tagsLine.split('#');
      } else if (line.startsWith('http')) {
        currentLinks.push(line);
      } else {
        currentContent = line.toLowerCase();
      }
    } else if (currentContent) {
      if (line.startsWith('#')) {
        const tagsLine = line.slice(1).replace(/\s/g, '');
        currentTags = currentTags.concat(tagsLine.split('#'));
      } else if (line.startsWith('http')) {
        currentLinks.push(line);
      } else {
        currentContent += ',' + line.toLowerCase();
      }
    }
  }

  if (currentTitle) {
    recipes[currentTitle] = {
      ingredients: currentContent ? currentContent.split(',') : [],
      tags: currentTags,
      links: currentLinks,
      comments: currentComments
    };
  }

  return recipes;
}

function normalizeLink(link){
  const normalizedLink = link.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/,/g, '').replace(/\./g, '').replace(/\'/g, '').replace(/[()]/g, '').toLowerCase();
  return normalizedLink;
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

function createRecipeHTML(recipeTitle, recipeIngredients, recipeTags, recipeLinks, recipeComments) {
  console.log(recipeTitle);
  const filename = `${normalizeLink(recipeTitle)}.html`;
  console.log(filename);
  const filePath = path.join(folderPath, filename);
  const hasIngredients = recipeIngredients && recipeIngredients.length > 0;
  const hasLinks = recipeLinks && recipeLinks.length > 0;
  const hasComments = recipeComments && recipeComments.length > 0;
  const hasTags = recipeTags && recipeTags.length > 0;

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
      ${hasIngredients ? '</ul><br>' : ''}
      
      ${hasLinks ? '<div class="links">' : ''}
        ${hasLinks ? '<ol>' : ''}
        ${hasLinks ? recipeLinks.map(link => `<li><a href="${link}" target="_blank" style="text-decoration: underline;">${link.includes('youtu') ? 'YouTube link' : (link.includes('pin') ? 'Pinterest link' : 'link')}</a></li>`).join('') : ''}
        ${hasLinks ? '</ol>' : ''}
      ${hasLinks ? '</div>' : ''}
      
      ${hasComments ? '<div class="comments">' : ''}
        ${hasComments ? '<ul>' : ''}
          ${hasComments ? recipeComments.map(comment => `<li>${comment}</li>`).join('') : ''}
        ${hasComments ? '</ul>' : ''}
      ${hasComments ? '</div>' : ''}
      
        ${!(hasIngredients||hasLinks||hasComments)&&hasTags ? '<br>' : ''}
        ${hasTags ? recipeTags.map(tag => `<span class="tag"><a href="../tag.html#${normalizeLink(tag)}">#${tag}</a></span>`).join(' '): ''}

    </body>
    </html>
  `;
  
  fs.writeFileSync(filePath, html, 'utf-8');
  console.log(`Created ${filename}`);
  recipeArray += `${filePath.replace(/\\/g, '/')}', '`;
}

function createIndexHTML(recipeTitles) {
  recipeTitles.sort((a, b) => a.localeCompare(b, 'hu-HU'));
  const recipeLinks = recipeTitles.map(title => {
    const recipe = recipes[title];
    const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
    const hasLinks = recipe.links && recipe.links.length > 0;
    const linkText = hasIngredients || hasLinks ? title : `<span class="empty">${title}</span>`;
    return `<li><a href="recipes/${normalizeLink(title)}.html">${linkText}</a></li>`;
  }).join('');

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Vegán Receptek</title>
    <link rel="stylesheet" href="style.css">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
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
          var i = parseInt(Math.random() * (recipeArray.length-1));
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
    const recipeLinks = taggedRecipes.map(title => {
      const recipe = recipes[title];
      const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
      const hasLinks = recipe.links && recipe.links.length > 0;
      const linkText = hasIngredients || hasLinks ? title : `<span class="empty">${title}</span>`;
      return `<li><a href="recipes/${normalizeLink(title)}.html">${linkText}</a></li>`;
    }).join('');
    return `<section id="${normalizeLink(tag)}"><h3>#${tag}</h3><ul>${recipeLinks}</ul></section>`;
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
