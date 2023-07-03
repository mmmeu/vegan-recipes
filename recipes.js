const { link } = require('fs');
const fs = require('fs-extra');
const path = require('path');
const imgFolderPath = 'images';
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

const folderPath = 'recipes';

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}
else if (fs.existsSync(folderPath)) {
  fs.emptyDirSync(folderPath);
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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${recipeTitle}</title>
      <link rel="stylesheet" href="../style.css">
      <link href='https://fonts.googleapis.com/css?family=Salsa' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Russo One' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Roboto Condensed' rel='stylesheet'>
      <link rel="shortcut icon" type="image/x-icon" href="../favicon.ico?">
      <link rel="apple-touch-icon" type="image/png" sizes="180x180" href="../apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="../favicon-16x16.png">
      <link rel="manifest" href="../site.webmanifest">
    </head>
    <body>
      <header class="header2">
        <p><span class="icon"><a href="../index.html"><img src="../apple-touch-icon.png"></a> ${recipeTitle}</span></p>
      </header>
      ${imageExists ? `<div class="image"><img src="/${imgFolderPath}/${imgFileName}"></div>` : ''}

      ${hasIngredients ? '<ul>' : ''}
        ${hasIngredients ? recipeIngredients.map(ingredient =>  `<li>${ingredient}</li>`).join('') : ''}
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
    <link href='https://fonts.googleapis.com/css?family=Russo One' rel='stylesheet'>
    <link href='https://fonts.googleapis.com/css?family=Roboto Condensed' rel='stylesheet'>
    <link rel="shortcut icon" type="image/x-icon" href="favicon.ico?">
    <link rel="apple-touch-icon" type="image/png" sizes="180x180" href="apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
    <link rel="manifest" href="site.webmanifest">
  </head>
  <body>
    <header class="header">
      <p><a href="tag.html">#️⃣</a> Vegán Receptek <a href="#" onclick="randomSite();">🎲</a></p>
    </header>
    <div class=striped-list>
      <ul>
        ${recipeLinks}
      </ul>
    </div>
    <footer>${counterFull}/${counterAll}</footer>
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
    //console.log(taggedRecipes);
    taggedLinks[tag] = taggedRecipes;
    console.log(taggedLinks[tag][0]);
      var value = taggedLinks[tag];
      for (var i = 0; i < value.length; i++) {
        value[i] = `'${folderPath}/${normalizeLink(value[i])}.html'`;
    console.log(taggedLinks[tag]);
}});

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
      <title>Tagek</title>
      <link rel="stylesheet" href="style.css">
      <link href='https://fonts.googleapis.com/css?family=Salsa' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Russo One' rel='stylesheet'>
      <link href='https://fonts.googleapis.com/css?family=Roboto Condensed' rel='stylesheet'>
      <link rel="shortcut icon" type="image/x-icon" href="favicon.ico?">
      <link rel="apple-touch-icon" type="image/png" sizes="180x180" href="apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
      <link rel="manifest" href="site.webmanifest">
    </head>
    <body>
      <header class="header3">
      <p><span class="icon"><a href="index.html"><img src="apple-touch-icon.png"></a> Címkék</span></p>
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
recipeTitles.sort((a, b) => a.localeCompare(b, 'hu-HU'));
let recipeArray = [];
let data = '';
for (const recipeTitle in recipes) {
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
