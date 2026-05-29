Hi! This is for the UCLA CS35L Final Project. Below will be guides and notes before running this repository.

## To-do list:
- Rewrite app.py and grade.sql for categories
- Combine back and front ends to work
- Modification for proper weighting and categories
- Addition of online functionalities/account system
- Movement to a server database (non-local)

# Website notes
## Read before doing *any* frontend/UI development.
1. We are using gh-files to run the website, meaning that you will need to install a package before editing and deploying the page. Whenever you can, go to your local repository files (most likely ending with ~/finalGradeCalculator), run "cd docs" and "npm install" to install the package locally. It is set up so that you only need to install the package once, and *locally*. Do not remove docs/node_modules/ in .gitignore unless if we are removing gh-files. (In the case where you do not run "cd docs", it will create a new package.json and package-lock.json file and a big folder called node-modules. *Delete all 3 of them, then reinstall in the docs directory.*) DO NOT CHANGE THE NAME OF DOCS UNLESS IF WE STOP USING GITHUB PAGES!
2. Since you guys are using .tsx files for the website, you will have to run a command for the code to compile the .tsx file for it to operate as a .js file, which is "npm run deploy". It will NOT build correctly if you do not run this command. The current homepage in package.json is set to https://kevlao1.github.io/finalGradeCalculator, but you should not have any issue running it locally even with that set. If you somehow see the build folder that is running the website, DO NOT EDIT ANYTHING INSIDE THE FOLDER! Instead, only directly edit the .tsx file then recompile with the same command.
3. Since GitHub Pages runs *only* the website and not the servers behind it, we will need to use another free service for data storage. I will look into it in a bit, but if not, the server will have to be one of our computers.

# Setting up a virtual environment:
## Read before doing *any* backend development and tests locally.
1. Make sure that your local current repository is up-to-date; if it's not, save your work with "git add ." and "git commit" before running "git pull origin main" to get the newest main commit (assuming that your repository is already linked to the GitHub repository, which is an entirely separate thing with "git clone")
2. Run the command "python3 -m venv .venv" and "source .venv/bin/activate" to create and start running the virtual environment, respectively
3. Run the command "pip install -r requirements.txt" to automate the install process for all the modules required, it shouldn't take that long to download and you should be good to go (if you already set up a .venv/, then just do this step to update your modules)
4. Deactivation is done by running "deactivate". Reactivation is done via the same "source .venv/bin/activate" command, but without the reinstalling, since everything's already installed
## Some notes just in case:
1. The .gitignore file has .venv/ to prevent any installation of module files, do NOT remove it under any circumstances
2. I don't know if there are any modules for stuff outside Python, but currently the requirements.txt file only applies for Python modules 
3. This shouldn't really matter unless if you're running an *old* old version of Python, but it's currently set up for 3.12.2

# If you want to add a new Python module:
(This assumes that your original virtual environment has all the necessary modules to run it; if it does not, get it up-to-date first to make sure)
1. Code your implementation first, assuming you'll have all the functions of the module later on
2. Install the module in your virtual environment
3. Run "pip freeze > requirements.txt", this will capture all of the modules in the virtual environment into the requirements.txt file. Note that this will *overwrite* the file, so make sure you have all the necessary modules before overwriting it
4. Push and commit requirements.txt (and your modified code if it is ready) both locally *and* to GitHub.

(More guides/notes may be added based on necessity.)