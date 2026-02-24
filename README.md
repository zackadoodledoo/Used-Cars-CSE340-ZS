# Used-Cars-CSE340-ZS
Option B - Used Car Dealership. Details and Requirements: Option B: Build a Used Car Dealership If you prefer clear requirements, build a used car dealership website with these features: Public Pages: • Home page with featured vehicles • Browse vehicles, etc.....  link:[https://byui.instructure.com/courses/403274/assignments/16216857 ] 

Links:

Github: [....]


Render: [.....]

Youtube: [......]



### Build a Used Car Dealership Option B:
If you prefer clear requirements, build a used car dealership website with these features:
Public Pages:
• Home page with featured vehicles
• Browse vehicles by category (Trucks, Vans, Cars, SUVs)
• Individual vehicle detail pages with images, specs, and price
• Contact form (saves to database)
User Features (must be logged in):
• Leave reviews on vehicles
• Edit/delete own reviews
• Submit service requests for their vehicle (oil change, inspection, etc.)
• View history of service requests and their status
Employee Dashboard:
• Edit vehicle details (price, description, availability)
• Moderate/delete inappropriate reviews
• View and manage service requests
• Update service request status (Submitted, In Progress, Completed)
• Add notes to service requests
• View contact form submissions
Owner Dashboard (Full Admin):
• Everything employees can do, plus:
• Add, edit, and delete vehicle categories
• Add, edit, and delete vehicles from inventory
• Manage employee accounts (optional, can be hardcoded)
• View all system activity and user data
Database Requirements:
• Users table (with role field)
• Vehicles table
• Categories table (linked to vehicles)
• Reviews table (linked to users and vehicles)
• Service requests table (linked to users, with status tracking)
• Contact messages table
• Vehicle images table (one-to-many with vehicles)



##### What a success/failing grade looks like:

What Success Looks Like
You will know you are on the right track if:
• Someone could actually use your website for its intended purpose
• Your database structure would make sense to another developer
• Your code is organized well enough that you could hand it off to someone else
• The site works reliably without breaking
• Different user roles have genuinely different experiences
• Your deployment is stable and uses production-ready practices
What Will Result in a Failing Grade
• Incomplete or non-functional authentication system
• Major security vulnerabilities (plain text passwords, SQL injection risks, no input
validation)
• Poorly designed database (single table, no relationships, inappropriate data types)
• Broken deployment or inability to connect to the database
• Missing core concepts listed above
Submission Requirements
Before the deadline, you must submit:
1. GitHub repository URL (with meaningful commit history)
2. Live deployment URL on Render
Your deployment must:
• Be accessible and functioning
• Have a PostgreSQL database properly connected
• Include one test account for each user role (credentials in README)
Final Thoughts
This project is your opportunity to demonstrate that you can build real, functional web
applications. Focus on understanding what you are building and why. Build something you
are proud of, something that works, and something that demonstrates genuine mastery of
backend development.
Do not aim for the bare minimum. Be creative, experiment with ideas, and challenge
yourself to implement features that interest you. Practice your skills and have fun with this
project. If you approach it with curiosity and a desire to learn rather than just checking
boxes, you will not only pass easily but also build something meaningful that showcases
your abilities. The best projects come from students who genuinely engage with the
material and enjoy the process of building.
