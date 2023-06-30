import locale

# Set the locale to Hungarian
locale.setlocale(locale.LC_ALL, 'hu_HU.UTF-8')

# Read the contents of the TXT file
with open('recipes.txt', 'r', encoding='utf-8') as file:
    recipes = file.read().split('\n\n')

# Sort the recipes based on the capitalized title in Hungarian alphabetical order
sorted_recipes = sorted(recipes, key=lambda x: locale.strxfrm(x.split('\n')[0].capitalize()))

# Capitalize each title and add a new line after each title
capitalized_recipes = []
for recipe in sorted_recipes:
    lines = recipe.split('\n')
    if len(lines) > 0:
        title = lines[0].capitalize() + '\n'  # Add a new line after the capitalized title
        content = '\n'.join(lines[1:])
        capitalized_recipes.append(title + content)

# Write the sorted recipes to a new file
with open('recipes.txt', 'w', encoding='utf-8') as file:
    for i, recipe in enumerate(capitalized_recipes):
        file.write(recipe.strip())
        if i < len(capitalized_recipes) - 1:
            file.write('\n\n')
    file.write('\n')