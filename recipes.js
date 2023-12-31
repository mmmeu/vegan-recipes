const { link } = require('fs');
const fs = require('fs-extra');
const path = require('path');
const imgFolderPath = 'images';
const measurements = ["kevés", "fél", "csipet", "csipetnyi","liter","sok"]; // Add more measurements as needed
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
    const line = lines[i].trim(); // Trim leading and trailing whitespace

    if (line.startsWith('**')) {
      // Handle comments
      currentComments.push(line.slice(2).trim());
    } else if (line.length === 0) {
      // Handle empty lines
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
      // Handle recipe title
      currentTitle = capitalizeFirstLetter(line);
    } else if (!currentContent) {
      // Handle recipe content
      if (line.startsWith('#')) {
        // Handle tags
        const tagsLine = line.slice(1).replace(/\s/g, '');
        currentTags = tagsLine.split('#');
      } else if (line.startsWith('http')) {
        // Handle links
        currentLinks.push(line);
      } else if (line.startsWith('[[') && line.endsWith(']]')) {
        // Handle cross-references to other recipes
        const linkedRecipeTitle = line.slice(2, -2).trim();
        currentLinks.push(linkedRecipeTitle);
      } else {
        currentContent = line.toLowerCase();
      }
    } else if (currentContent) {
      // Handle additional content
      if (line.startsWith('#')) {
        // Handle tags
        const tagsLine = line.slice(1).replace(/\s/g, '');
        currentTags = currentTags.concat(tagsLine.split('#'));
      } else if (line.startsWith('http')) {
        // Handle links
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
  const normalizedLink = link.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/,/g, '').replace(/\./g, '').replace(/\'/g, '').replace(/[()]/g, '').replace(/^-/, '').toLowerCase();
  return normalizedLink;
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const filename = 'recipes.txt';
const recipes = readRecipesFromFile(filename);

const folderPath = 'recipes';

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}
else if (fs.existsSync(folderPath)) {
  fs.emptyDirSync(folderPath);
}

// Create a new folder for ingredient pages
const ingredientFolderPath = 'ingredients';
if (!fs.existsSync(ingredientFolderPath)) {
  fs.mkdirSync(ingredientFolderPath);
}
else if (fs.existsSync(ingredientFolderPath)) {
  fs.emptyDirSync(ingredientFolderPath);
}

function checkImageExists(folderPath, fileName) {
  const filePath = `${folderPath}/${fileName}`;
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function createRecipeHTML(recipeTitle, recipeIngredients, recipeTags, recipeLinks, recipeComments) {
  const filename = `${normalizeLink(recipeTitle)}.html`;
  const filePath = path.join(folderPath, filename);
  const hasIngredients = recipeIngredients && recipeIngredients.length > 0;
  const hasLinks = recipeLinks && recipeLinks.length > 0;
  const hasComments = recipeComments && recipeComments.length > 0;
  const hasTags = recipeTags && recipeTags.length > 0;
  const imgFileName = `${normalizeLink(recipeTitle)}.png`;
  const imageExists = checkImageExists(imgFolderPath, imgFileName);


  const ingredientLinks = hasIngredients
    ? recipeIngredients.map((ingredient) => {
        ingredient = ingredient.trim();
        if (ingredient.endsWith(']]')) {
          const linkedRecipeTitle = ingredient.slice(2, -2).trim();
          const cleanIngredientName = ingredient.replace(/\b\d+(\.\d+)?(?:[kKgGmMlL]|gramm?|liter?)?\b/g, '').replace(/\((.*?)\)/g, '').replace(new RegExp(`\\b(?:${measurements.join('|')})\\b`, 'gi'), '').replace('[[', '').replace(']]', '').trim();
          const normalizedIngredient = normalizeLink(cleanIngredientName);
          return `<a href="../ingredients/${normalizedIngredient}.html">${linkedRecipeTitle}</a> <a href="../recipes/${normalizeLink(linkedRecipeTitle)}.html" style="text-decoration: underline; color: #8057a4;">(link)</a>`;
        } else {
          const cleanIngredientName = ingredient.replace(/\b\d+(\.\d+)?(?:[kKgGmMlL]|gramm?|liter?)?\b/g, '').replace(/\((.*?)\)/g, '').replace(new RegExp(`\\b(?:${measurements.join('|')})\\b`, 'gi'), '').replace('[[', '').replace(']]', '').trim();
          const normalizedIngredient = normalizeLink(cleanIngredientName);
          return `<a href="../ingredients/${normalizedIngredient}.html">${ingredient}</a>`;
        }
      })
    : [];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${recipeTitle}</title>
      <link rel="stylesheet" href="../style.css">
      <link href='https://fonts.googleapis.com/css?family=Salsa' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Chivo' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Russo One' rel='stylesheet'>
      <link rel="shortcut icon" type="image/x-icon" href="../favicon.ico?">
      <link rel="apple-touch-icon" type="image/png" sizes="180x180" href="../apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="../favicon-16x16.png">
      <link rel="manifest" href="../site.webmanifest">
    </head>
    <body>
    <div class="container">
      <header class="header2">
        <p><span class="icon"><a href="../index.html"><img src="../apple-touch-icon.png"></a> ${recipeTitle}</span></p>
      </header>
      <div class="content">
      <div class="content2">
      ${imageExists ? `<div class="image"><img src="/${imgFolderPath}/${imgFileName}"></div>` : ''}

      ${hasIngredients ? '<ul>' : ''}
        ${hasIngredients ? ingredientLinks.map(ingredientLinks =>  `<li>${ingredientLinks}</li>`).join('') : ''}
      ${hasIngredients ? '</ul>' : ''}
      
      ${hasIngredients&&hasLinks ? '<hr>' : ''}
      ${hasLinks ? '<div class="links">' : ''}
        ${hasLinks ? '<ol>' : ''}
        ${hasLinks ? recipeLinks.map(link => `<li><a href="${link}" target="_blank" style="text-decoration: underline; color: #8057a4;">${link.includes('youtu') ? 'YouTube link' : (link.includes('pin') ? 'Pinterest link' : 'link')}</a></li>`).join('') : ''}
        ${hasLinks ? '</ol>' : ''}
      ${hasLinks ? '</div>' : ''}
      
      ${hasComments ? '<hr><div class="comments">' : ''}
        ${hasComments ? '<ul>' : ''}
          ${hasComments ? recipeComments.map(comment => `<li>${comment}</li>`).join('') : ''}
        ${hasComments ? '</ul>' : ''}
      ${hasComments ? '</div>' : ''}
      
        ${!(hasIngredients||hasLinks||hasComments)&&hasTags ? '<br>' : ''}
        ${(hasIngredients||hasLinks||hasComments)&&hasTags ? '<hr>' : ''}
        ${hasTags ? recipeTags.map(tag => `<span class="tag"><a href="../tag.html#${normalizeLink(tag)}">#${tag}</a></span>`).join(' '): ''}

        </div>
        </div>
        </div>
    </body>
    </html>
  `;
  
  fs.writeFileSync(filePath, html, 'utf-8');
  console.log(`Created ${filename}`);
  recipeArray += `${filePath.replace(/\\/g, '/')}', '`;
}

function createIndexHTML(recipeTitles) {
  let counterAll = 0;
  let counterFull = 0;
  const recipeLinks = recipeTitles.map(title => {
    const recipe = recipes[title];
    const imgFileName = `${normalizeLink(title)}.png`;
    const imageExists = checkImageExists(imgFolderPath, imgFileName);
    const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
    const hasLinks = recipe.links && recipe.links.length > 0;
    if (hasIngredients || hasLinks || imageExists){
      counterFull++;
    }
    counterAll++;
    const linkText = hasIngredients || hasLinks || imageExists ? title : `<span class="empty">${title}</span>`;
    return `<li><a href="recipes/${normalizeLink(title)}.html">${linkText}</a></li>`;
  }).join('');


  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Vegán Receptek</title>
    <link rel="stylesheet" href="style.css">
    <link href='https://fonts.googleapis.com/css?family=Salsa' rel='stylesheet'>
    <link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
    <link href='https://fonts.googleapis.com/css?family=Chivo' rel='stylesheet'>
    <link href='https://fonts.googleapis.com/css?family=Russo One' rel='stylesheet'>
    <link rel="shortcut icon" type="image/x-icon" href="favicon.ico?">
    <link rel="apple-touch-icon" type="image/png" sizes="180x180" href="apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
    <link rel="manifest" href="site.webmanifest">
  </head>
  <body>
  <div class="container">
    <header class="header">
      <div><p><h1>Vegán Receptek</h1></p></div><div class="emoji"><a href="tag.html">#️⃣</a> <a href="ingredients.html">🧅</a> <a href="#" onclick="randomSite();">🎲</a></div>
    </header>
    <div class="content">
    <div class=striped-list>
      <ul>
        ${recipeLinks}
      </ul>
    </div>
    <footer>${counterFull}/${counterAll}</footer>
    </div>
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
  const allTags = [];
  for (const recipeTitle in recipes) {
    const recipeTags = recipes[recipeTitle].tags;
    allTags.push(...recipeTags);
  }

  const uniqueTags = Array.from(new Set(allTags)).sort();
  let taggedLinks = {};
  const tagSections2 = uniqueTags.map(tag => {
    const taggedRecipes = recipeTitles.filter(title => recipes[title].tags.includes(tag));
    taggedLinks[tag] = taggedRecipes;
      var value = taggedLinks[tag];
      for (var i = 0; i < value.length; i++) {
        value[i] = `'${folderPath}/${normalizeLink(value[i])}.html'`;
}});

  const jump = uniqueTags.map(tag => {
    return `<div><a href="#${normalizeLink(tag)}">#${tag}</a></div>`;
  }).join('');

  const tagSections = uniqueTags.map(tag => {
    const taggedRecipes = recipeTitles.filter(title => recipes[title].tags.includes(tag));
    const recipeLinks = taggedRecipes.map(title => {
      const recipe = recipes[title];
      const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
      const hasLinks = recipe.links && recipe.links.length > 0;
      const imgFileName = `${normalizeLink(title)}.png`;
      const imageExists = checkImageExists(imgFolderPath, imgFileName);
      const linkText = hasIngredients || hasLinks || imageExists ? title : `<span class="empty">${title}</span>`;
      return `<li><a href="recipes/${normalizeLink(title)}.html">${linkText}</a></li>`;
    }).join('');
    return `<section id="${normalizeLink(tag)}"><p>#${tag} <a href="#" onclick="${normalizeLink(tag)}RandomSite();">🎲</a></p><ul>${recipeLinks}</ul></section>
    
    <script>
      let ${normalizeLink(tag)}Links = [${taggedLinks[tag]}];
      function ${normalizeLink(tag)}RandomSite() {
          var i = parseInt(Math.random() * (${normalizeLink(tag)}Links.length));
          location.href = ${normalizeLink(tag)}Links[i];
      }
    </script>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Címkék</title>
      <link rel="stylesheet" href="style.css">
      <link href='https://fonts.googleapis.com/css?family=Salsa' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Chivo' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Russo One' rel='stylesheet'>
      <link rel="shortcut icon" type="image/x-icon" href="favicon.ico?">
      <link rel="apple-touch-icon" type="image/png" sizes="180x180" href="apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
      <link rel="manifest" href="site.webmanifest">
    </head>
    <body>
    <div class="container">
      <header class="header3">
      <p><span class="icon"><a href="index.html"><img src="apple-touch-icon.png"></a> Címkék</span></p>
      </header>
      <div class="content">
      <div class="jump">
      ${jump}
      </div>
      <div class="tag-list">
        ${tagSections}
        </div>
        </div>
        </div>
    </body>
    </html>
  `;

  fs.writeFileSync('tag.html', html, 'utf-8');
  console.log('Created tag.html');
}

function createIngredientsHTML(recipeTitles) {
  
  const allIngredients = [];
  const ingredientLinks = {};


  for (const recipeTitle in recipes) {
    const recipeIngredients = recipes[recipeTitle].ingredients;
    recipeIngredients.forEach((ingredient) => {
      if (!ingredient.includes('+')) {
      const normalizedIngredient = normalizeLink(ingredient);
      allIngredients.push({ originalName: ingredient, normalizedName: normalizedIngredient });
      if (!ingredientLinks[normalizedIngredient]) {
        ingredientLinks[normalizedIngredient] = [];
      }
      
      ingredientLinks[normalizedIngredient].push(recipeTitle);}
    });
  }

  // Group ingredients by normalized name
  const groupedIngredients = {};
  allIngredients.forEach(({ originalName, normalizedName }) => {
    const cleanIngredientName = originalName.replace(/\b\d+(\.\d+)?(?:[kKgGmMlL]|gramm?|liter?)?\b/g, '').replace(/\((.*?)\)/g, '').replace(new RegExp(`\\b(?:${measurements.join('|')})\\b`, 'gi'), '').replace('[[', '').replace(']]', '').trim();
    if (!groupedIngredients[cleanIngredientName]) {
      groupedIngredients[cleanIngredientName] = [];
    }
    groupedIngredients[cleanIngredientName].push(normalizedName);
  });

  // Sort and create HTML for each grouped ingredient
  let ingredientList = '';
  Object.keys(groupedIngredients).sort((a, b) => a[0].localeCompare(b[0], 'hu-HU')).forEach((cleanIngredientName) => {
    const normalizedIngredients = Array.from(new Set(groupedIngredients[cleanIngredientName])).sort((a, b) => a[0].localeCompare(b[0], 'hu-HU'));
    const recipeLinks = normalizedIngredients
      .map((normalizedIngredient) => {
        const recipeTitles = ingredientLinks[normalizedIngredient] || [];
        return recipeTitles
          .map((title) => `<li><a href="../recipes/${normalizeLink(title)}.html">${title}</a></li>`)
          .join('');
      })
      .join('');

    // Create separate HTML file for each ingredient
    const ingredientHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${cleanIngredientName}</title>
        <link rel="stylesheet" href="../style.css">
        <link href='https://fonts.googleapis.com/css?family=Salsa' rel='stylesheet'>
        <link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
        <link href='https://fonts.googleapis.com/css?family=Chivo' rel='stylesheet'>
        <link href='https://fonts.googleapis.com/css?family=Russo One' rel='stylesheet'>
        <link rel="shortcut icon" type="image/x-icon" href="../favicon.ico?">
        <link rel="apple-touch-icon" type="image/png" sizes="180x180" href="../apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="../favicon-16x16.png">
        <link rel="manifest" href="../site.webmanifest">
      </head>
      <body>
        <div class="container">
          <header class="header2">
          <div><p><span class="icon"><a href="../index.html"><img src="../apple-touch-icon.png"></a> ${cleanIngredientName} receptek</span></p></div>
          </header>
          <div class="content">
            <section>
              <ul>${recipeLinks}</ul>
            </section>
          </div>
        </div>
      </body>
      </html>
    `;

  

    // Write the HTML content to the ingredient file
    const ingredientFilePath = path.join(ingredientFolderPath, `${normalizeLink(cleanIngredientName)}.html`);
    fs.writeFileSync(ingredientFilePath, ingredientHTML, 'utf-8');
    console.log(`Created ${ingredientFilePath}`);

    // Add the link to the ingredient list
    ingredientList += `<li><a href="${ingredientFilePath}">${cleanIngredientName}</a></li>`;
  });

  // Create ingredients.html with links to ingredient pages
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ingredients</title>
      <link rel="stylesheet" href="style.css">
      <link href='https://fonts.googleapis.com/css?family=Salsa' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Chivo' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Russo One' rel='stylesheet'>
      <link rel="shortcut icon" type="image/x-icon" href="favicon.ico?">
      <link rel="apple-touch-icon" type="image/png" sizes="180x180" href="apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
      <link rel="manifest" href="site.webmanifest">
    </head>
    <body>
      <div class="container">
        <header class="header3">
        <p><span class="icon"><a href="index.html"><img src="apple-touch-icon.png"></a> Hozzávalók</span></p>
        </header>
        <div class="content">
          <div class=striped-list>
            <ul>${ingredientList}</ul>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  fs.writeFileSync('ingredients.html', html, 'utf-8');
  console.log('Created ingredients.html');
}

const recipeTitles = Object.keys(recipes);
recipeTitles.sort((a, b) => a.localeCompare(b, 'hu-HU'));
let recipeArray = [];

// Convert dictionary into an array of key-value pairs
const dictionaryArray = Object.entries(recipes);

// Sort the array based on the keys
dictionaryArray.sort((a, b) => a[0].localeCompare(b[0], 'hu-HU'));

// Create a new sorted dictionary object
const sortedDictionary = {};
for (const [key, value] of dictionaryArray) {
  sortedDictionary[key] = value;
}
let data = '';
for (const recipeTitle in sortedDictionary) {
  const recipeIngredients = recipes[recipeTitle].ingredients;
  const recipeTags = recipes[recipeTitle].tags;
  const recipeLinks = recipes[recipeTitle].links;
  const recipeComments = recipes[recipeTitle].comments;
  const hasIngredients = recipeIngredients && recipeIngredients.length > 0;
  const hasLinks = recipeLinks && recipeLinks.length > 0;
  const hasComments = recipeComments && recipeComments.length > 0;
  const hasTags = recipeTags && recipeTags.length > 0;
  createRecipeHTML(recipeTitle, recipeIngredients, recipeTags, recipeLinks, recipeComments);
  data += `${recipeTitle}\n`;
  if (hasIngredients){
    data += `${recipeIngredients}\n`;
  }if (hasLinks){
    data += `${recipeLinks.map(link => `${link}\n`).join('')}`;
  }if (hasComments){
    data += `${recipeComments.map(comment => `**${comment}\n`).join('')}`;
  }if (hasTags){
    data += `${recipeTags.map(tag => `#${tag}\n`).join('')}`;
  } data += `\n`;
}

fs.writeFile(filename, data, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Data written to file successfully.');
});



createIndexHTML(recipeTitles);
createTagHTML(recipeTitles);
createIngredientsHTML(recipeTitles);

