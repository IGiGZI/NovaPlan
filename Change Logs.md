# Changes in this version:

## ✅ Added Docker to the app:

• Put the frontend folder into it's own container, same with the backend folder, and lastly added the AI into it's own container as well

• And connected them via multi containers and anyone can now access the app and try it out for themselves using:
            docker-compose up --build

• By running that command every dependency required will be installed making it easy to run immediately without the hassle of trying to install dependencies and hoping it'll run

• Additionally, Docker acts as a virtual environment so anything that needs a venv Docker handles it by default no need to install any venv
    
## ✅ Impelemented Weave: Weights & Biases to the app:

• Weave tracks Gemini API requests (inputs, and outputs) and also tracks the number of tokens used for each request made

• The requests that are made are then analyized by an AI judge to check for any errors or discrepancies in the outputs
    
## ✅ Fixed an issue regarding the backend of the app:

• The issue was that the backend code tries to run two servers at the same time (the backend server, and the AI server)
        
• That was fixed by adding a checking function in the server.js file that makes it so that if the app is run through containers (AKA Docker) then there's no need to call for the AI server to start, however, if that condition is not fulfilled then it reverts back to starting both servers at the same time
    

# Required changes that will be addressed in the new upcoming version:

🎯 Addition of detailed description regarding (Data, tech, Engineering, etc.) career fields

🎯 And also the addition of language links like in the (Backend Developer, Frontend Developer, Game Developer, etc. careers) (Java, Python, Node.js, etc.) to every other career as well

🎯 Skill level question to determine the user's skill level has to also be added for every other career as well --- [Up for debate]

🎯 Improving the career names (HR for instance should also have Human Resources as an actual name)
    
🎯 Improving the questionnaire that the user has to go through by providing clear and detailed answers (no UI/UX as a vauge answer for instance) --- [Up for debate]

    
