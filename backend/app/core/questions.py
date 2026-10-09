"""Question bank. Fields: id, role, skill, dimension, level, prompt, options (4), answer (index 0-3), why."""

QUESTIONS = [
    {"id": "py-01", "role": "Python Developer", "skill": "APIs", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "A production API returns correct results but has no tests for malformed input. What evidence is most useful next?",
     "options": ["Add a README paragraph", "Add failure-path tests and observe the behavior", "Increase the UI animation", "Rename the endpoint"],
     "answer": 1, "why": "Tests for bad input create observable evidence of how the API fails."},

    {"id": "py-02", "role": "Python Developer", "skill": "Testing", "dimension": "Testing", "level": "Intermediate",
     "prompt": "parse_age(text) converts text to an integer age. Which test set exposes the most weaknesses?",
     "options": ["One test with '25'", "Two tests with '30'", "Tests for '25', ' 25 ', '', 'abc', '-1' and '2.5'", "Two tests that call it twice with the same input"],
     "answer": 2, "why": "Edge cases (spaces, empty, non-numbers, negatives, decimals) are where parsers break."},

    {"id": "py-03", "role": "Python Developer", "skill": "Python", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "def add(item, items=[]): items.append(item); return items. Calling add(1) then add(2) returns [1, 2]. Why?",
     "options": ["The default list is created once and shared between calls", "append is slow", "Python copies lists incorrectly", "items must be global"],
     "answer": 0, "why": "Default values are evaluated once when the function is defined, so a mutable default is shared."},

    {"id": "py-04", "role": "Python Developer", "skill": "Packaging", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "You want others to install your project with pip and get the right dependencies. What is the best first step?",
     "options": ["Email the .py files", "Rename the folder", "Commit the __pycache__ folder", "Add a pyproject.toml with metadata and dependencies"],
     "answer": 3, "why": "pyproject.toml is the standard place to declare how a project is built and what it needs."},

    {"id": "py-05", "role": "Python Developer", "skill": "SQL", "dimension": "Transfer", "level": "Intermediate",
     "prompt": "You know how to remove duplicates from a Python list. A table has duplicate customer emails. Which idea transfers?",
     "options": ["Sort alphabetically and hope", "Pick a key (email) and keep one row per key, for example with GROUP BY or ROW_NUMBER", "Add more columns", "Drop the email column"],
     "answer": 1, "why": "De-duplicating by a key is the same idea; only the tool changes."},

    {"id": "py-06", "role": "Python Developer", "skill": "APIs", "dimension": "Security", "level": "Intermediate",
     "prompt": "An endpoint builds an SQL string by joining the 'name' query parameter. What is the correct fix?",
     "options": ["Hide the endpoint URL", "Check only the length of name", "Use parameterised queries", "Convert name to uppercase"],
     "answer": 2, "why": "Parameterised queries keep user input as data, never as SQL code."},

    {"id": "py-07", "role": "Python Developer", "skill": "Testing", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "A test passes on your machine but fails in CI. What is the best first step?",
     "options": ["Delete the failing test", "Re-run the pipeline until it passes", "Compare the environments (Python and package versions, env vars, files) and read the CI log", "Mark the test as skipped"],
     "answer": 2, "why": "Failures that only appear in one place usually come from a difference between environments."},

    {"id": "py-08", "role": "Python Developer", "skill": "Python", "dimension": "Problem Solving", "level": "Intermediate",
     "prompt": "You must find the 3 most common words in a very large text file without loading it all into memory. What is the best approach?",
     "options": ["Read the whole file into one string and sort it", "Use nested loops over every pair of words", "Read line by line and count words with collections.Counter", "Ask the user for a smaller file"],
     "answer": 2, "why": "Streaming line by line keeps memory small, and Counter.most_common(3) gives the answer."},

    {"id": "py-09", "role": "Python Developer", "skill": "APIs", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "Your API must reject requests with a missing 'email'. Where should this check live?",
     "options": ["Only in the front-end form", "At the API boundary using a schema, returning a clear 422", "In the database error message", "Nowhere, clients can be trusted"],
     "answer": 1, "why": "The server cannot trust clients, so validation belongs at the API boundary."},

    {"id": "py-10", "role": "Python Developer", "skill": "SQL", "dimension": "Application", "level": "Beginner",
     "prompt": "Which query returns the number of orders for each customer?",
     "options": ["SELECT * FROM orders ORDER BY customer_id", "SELECT DISTINCT customer_id FROM orders", "SELECT COUNT(customer_id) FROM orders", "SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id"],
     "answer": 3, "why": "GROUP BY makes one row per customer, and COUNT(*) counts the orders in each group."},

    {"id": "py-11", "role": "Python Developer", "skill": "Packaging", "dimension": "Adaptation", "level": "Advanced",
     "prompt": "Your library must keep working on an older Python version than the one you develop on. What reduces the risk most?",
     "options": ["Hope it works", "Test in CI against each supported Python version and declare requires-python", "Delete the type hints", "Tell users to upgrade"],
     "answer": 1, "why": "Declaring the supported range and testing every version catches incompatibilities early."},

    {"id": "py-12", "role": "Python Developer", "skill": "Python", "dimension": "Transfer", "level": "Beginner",
     "prompt": "You know how to build a list with a comprehension. How would you build a dict mapping each word to its length?",
     "options": ["Use a while loop with a global counter", "Use a dict comprehension: {w: len(w) for w in words}", "Use recursion on the list", "Convert the list to a string"],
     "answer": 1, "why": "Dict comprehensions use the same pattern as list comprehensions, with key: value."},
]


QUESTIONS += [
    {"id": "ml-01", "role": "ML Engineer", "skill": "Machine Learning", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "A fraud model reports 99% accuracy, but only 1% of transactions are fraud. What should you check next?",
     "options": ["Nothing, 99% is excellent", "Whether it simply predicts 'not fraud' every time, using precision, recall and a confusion matrix", "Whether training was fast enough", "Whether the dataset has enough columns"],
     "answer": 1, "why": "With imbalanced classes, accuracy hides failure on the rare class. Precision and recall show it."},

    {"id": "ml-02", "role": "ML Engineer", "skill": "Machine Learning", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "Training accuracy is 98% but validation accuracy is 71%. What is the most likely problem?",
     "options": ["Underfitting: the model is too simple", "The learning rate is too low", "Overfitting: the model memorised the training data", "The dataset has too many rows"],
     "answer": 2, "why": "A large gap between training and validation performance is the classic sign of overfitting."},

    {"id": "ml-03", "role": "ML Engineer", "skill": "Pandas", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "df[df['age'] > 30]['score'] = 0 raises SettingWithCopyWarning and df does not change. What is the fix?",
     "options": ["df.loc[df['age'] > 30, 'score'] = 0", "Restart the notebook", "Convert the DataFrame to a list", "Call df.copy() and ignore the original"],
     "answer": 0, "why": "Chained indexing may assign to a temporary copy. .loc selects rows and column in one step so the assignment reaches df."},

    {"id": "ml-04", "role": "ML Engineer", "skill": "Pandas", "dimension": "Application", "level": "Beginner",
     "prompt": "A DataFrame has columns region and revenue. Which code gives the average revenue per region?",
     "options": ["df['revenue'].mean()", "df.sort_values('region')", "df.describe()['revenue']", "df.groupby('region')['revenue'].mean()"],
     "answer": 3, "why": "groupby splits the rows by region, and mean() averages revenue inside each group."},

    {"id": "ml-05", "role": "ML Engineer", "skill": "Machine Learning", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "You standardise the whole dataset and only then split it into train and test sets. What is the risk?",
     "options": ["Training becomes slower", "Labels are shuffled", "No risk, the order does not matter", "Data leakage: information from the test set influences training"],
     "answer": 3, "why": "The mean and standard deviation used for scaling include test rows, so the test set is no longer unseen."},

    {"id": "ml-06", "role": "ML Engineer", "skill": "FastAPI", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "A prediction endpoint receives JSON features. How do you reject malformed input with a clear error?",
     "options": ["Declare a Pydantic model for the request body so FastAPI validates it and returns 422", "Wrap everything in try/except and return 200", "Trust the client to send valid data", "Print the error in the server console"],
     "answer": 0, "why": "A schema at the API boundary validates every request and returns a clear 422 automatically."},

    {"id": "ml-07", "role": "ML Engineer", "skill": "Docker", "dimension": "Deployment", "level": "Intermediate",
     "prompt": "Your model container runs on your laptop but fails on the server with a missing library. What best prevents this?",
     "options": ["Ask the server admin to install packages by hand", "Copy your laptop's site-packages folder into the image", "Pin dependencies in requirements.txt and install them inside the Dockerfile", "Disable the failing import"],
     "answer": 2, "why": "A pinned dependency list installed during the image build makes every environment identical."},

    {"id": "ml-08", "role": "ML Engineer", "skill": "SQL", "dimension": "Application", "level": "Intermediate",
     "prompt": "Which query returns customers who placed more than 3 orders?",
     "options": ["SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) > 3", "SELECT customer_id FROM orders WHERE COUNT(*) > 3", "SELECT customer_id FROM orders ORDER BY COUNT(*) > 3", "SELECT DISTINCT customer_id > 3 FROM orders"],
     "answer": 0, "why": "WHERE cannot use aggregates. HAVING filters groups after GROUP BY has counted them."},

    {"id": "ml-09", "role": "ML Engineer", "skill": "Machine Learning", "dimension": "Transfer", "level": "Intermediate",
     "prompt": "You know cross-validation for a classifier. Next you must predict house prices. What transfers?",
     "options": ["Use accuracy because it is the same metric", "Validate on the training data", "Skip validation for regression", "Use k-fold splits and measure error with a regression metric such as RMSE or MAE"],
     "answer": 3, "why": "The validation idea is the same. Only the metric changes, because prices are numbers, not classes."},

    {"id": "ml-10", "role": "ML Engineer", "skill": "Python", "dimension": "Problem Solving", "level": "Intermediate",
     "prompt": "A script loads a 5 GB CSV and crashes with a memory error. What is the best first approach?",
     "options": ["Convert the file to Excel", "Read it in chunks, or load only the needed columns and dtypes", "Buy more RAM", "Ignore the error and retry"],
     "answer": 1, "why": "Processing in chunks or loading fewer and smaller columns fixes the cause instead of the symptom."},

    {"id": "ml-11", "role": "ML Engineer", "skill": "FastAPI", "dimension": "Security", "level": "Intermediate",
     "prompt": "Your expensive prediction endpoint is public. What protects it best?",
     "options": ["Hide the URL", "Rename the route", "Require authentication and add rate limiting", "Use a bigger server"],
     "answer": 2, "why": "Authentication limits who can call it, and rate limiting limits how often, so one caller cannot drain your resources."},

    {"id": "ml-12", "role": "ML Engineer", "skill": "Docker", "dimension": "Adaptation", "level": "Advanced",
     "prompt": "Your image is 2 GB and deployments are slow. What most reduces its size?",
     "options": ["Use a slim base image and keep build tools and caches out of the final image", "Add more layers", "Install everything with apt-get", "Use the latest tag"],
     "answer": 0, "why": "A smaller base image and a clean final stage remove most of the weight."},
]


QUESTIONS += [
    {"id": "ai-01", "role": "AI Engineer", "skill": "Python", "dimension": "Application", "level": "Intermediate",
     "prompt": "An AI application needs to process many independent documents. What Python approach is most appropriate for reusable processing logic?",
     "options": ["Put all processing in global variables", "Create a function that accepts one document and returns a structured result", "Copy the same code into every route", "Store every document permanently in a module variable"],
     "answer": 1, "why": "A focused function makes document processing reusable, testable and easier to compose."},

    {"id": "ai-02", "role": "AI Engineer", "skill": "Python", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "An AI pipeline occasionally fails because a model response is missing a field. What is the best first fix?",
     "options": ["Assume the field always exists", "Validate the response structure before using it", "Restart the server after every request", "Hide the exception"],
     "answer": 1, "why": "External model responses should be treated as untrusted data and validated at the boundary."},

    {"id": "ai-03", "role": "AI Engineer", "skill": "LLM Apps", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "An LLM assistant frequently invents facts when the answer is not in its source material. What is the most useful improvement?",
     "options": ["Increase the font size", "Provide relevant retrieved context and instruct the model to stay within that evidence", "Remove all user questions", "Use a longer welcome message"],
     "answer": 1, "why": "Grounding the model in relevant evidence reduces unsupported answers."},

    {"id": "ai-04", "role": "AI Engineer", "skill": "LLM Apps", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "Your application calls an LLM provider directly from several API routes. What design reduces duplication?",
     "options": ["Copy the provider code into every route", "Create a shared AI service/provider abstraction", "Put credentials in every request body", "Call the provider from the database"],
     "answer": 1, "why": "A shared provider abstraction centralises configuration, errors, retries and provider changes."},

    {"id": "ai-05", "role": "AI Engineer", "skill": "Prompting", "dimension": "Application", "level": "Beginner",
     "prompt": "You need an LLM to return predictable JSON for an application. What prompt practice helps most?",
     "options": ["Ask for anything it wants", "Clearly specify the required fields and output format", "Use unrelated examples", "Tell it to be creative"],
     "answer": 1, "why": "Explicit output requirements make the desired structure clear."},

    {"id": "ai-06", "role": "AI Engineer", "skill": "Prompting", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "A prompt produces inconsistent answers for the same task. What should you investigate first?",
     "options": ["Whether the prompt has clear instructions, constraints and examples", "Whether the UI has rounded corners", "Whether the database has indexes", "Whether the user has dark mode enabled"],
     "answer": 0, "why": "Ambiguous instructions and inconsistent context are common causes of variable task performance."},

    {"id": "ai-07", "role": "AI Engineer", "skill": "FastAPI", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "An AI endpoint accepts a user message. Where should input length limits be enforced?",
     "options": ["Only in the browser", "At the API boundary using request validation", "Only after the LLM responds", "Nowhere"],
     "answer": 1, "why": "Server-side validation prevents oversized input from reaching expensive downstream processing."},

    {"id": "ai-08", "role": "AI Engineer", "skill": "FastAPI", "dimension": "Security", "level": "Intermediate",
     "prompt": "An endpoint exposes an expensive AI operation. Which combination is most appropriate?",
     "options": ["Hide the route", "Authentication and rate limiting", "Rename the route", "Allow unlimited anonymous requests"],
     "answer": 1, "why": "Authentication controls access and rate limiting controls request volume."},

    {"id": "ai-09", "role": "AI Engineer", "skill": "Evaluation", "dimension": "Testing", "level": "Intermediate",
     "prompt": "You changed an LLM prompt and want to know whether answers improved. What is the best evidence?",
     "options": ["One successful example", "A fixed evaluation set with defined criteria and comparison before and after", "The developer's opinion", "A longer prompt"],
     "answer": 1, "why": "A repeatable evaluation set makes changes measurable rather than anecdotal."},

    {"id": "ai-10", "role": "AI Engineer", "skill": "Evaluation", "dimension": "Reasoning", "level": "Advanced",
     "prompt": "An AI system scores well on average but fails badly on safety-related examples. What should you do?",
     "options": ["Ignore the failures because the average is high", "Inspect the failure cases and report safety performance separately", "Remove the difficult examples", "Only measure latency"],
     "answer": 1, "why": "Aggregate scores can hide important failure modes, so critical subsets need separate evaluation."},

    {"id": "ai-11", "role": "AI Engineer", "skill": "Docker", "dimension": "Deployment", "level": "Intermediate",
     "prompt": "An AI service works locally but cannot find its configured model endpoint in production. What should be checked first?",
     "options": ["The application font", "Environment variables and runtime configuration", "The README title", "The user's browser theme"],
     "answer": 1, "why": "Environment-specific configuration should be supplied through the deployment environment rather than hard-coded."},

    {"id": "ai-12", "role": "AI Engineer", "skill": "Docker", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "Why should an AI application's provider credentials not be copied into the Docker image?",
     "options": ["They make Python slower", "Secrets baked into an image can be exposed to anyone with access to the image", "Docker cannot run Python", "The image becomes a PDF"],
     "answer": 1, "why": "Secrets should be supplied securely at runtime instead of permanently embedded in an image."},
]


QUESTIONS += [
    {"id": "ds-01", "role": "Data Scientist", "skill": "Python", "dimension": "Application", "level": "Intermediate",
     "prompt": "You need to repeat the same data-cleaning operation across several datasets. What is the best approach?",
     "options": ["Manually edit every file", "Write a reusable function for the cleaning operation", "Copy the notebook repeatedly", "Store results in global variables"],
     "answer": 1, "why": "Reusable functions reduce duplication and make data preparation easier to test."},

    {"id": "ds-02", "role": "Data Scientist", "skill": "Python", "dimension": "Problem Solving", "level": "Intermediate",
     "prompt": "A Python analysis becomes slow after adding nested loops over a large dataset. What should you investigate?",
     "options": ["Whether vectorised or grouped operations can replace repeated Python-level loops", "Whether the notebook theme is slow", "Whether to delete the dataset", "Whether to rename variables"],
     "answer": 0, "why": "Vectorised and grouped operations can substantially reduce unnecessary Python-level iteration."},

    {"id": "ds-03", "role": "Data Scientist", "skill": "Pandas", "dimension": "Application", "level": "Beginner",
     "prompt": "You need the average sales by region from a DataFrame. Which operation is appropriate?",
     "options": ["groupby('region')['sales'].mean()", "sort_values('sales')", "drop_duplicates()", "head()"],
     "answer": 0, "why": "Grouping by region and calculating the mean produces one average per region."},

    {"id": "ds-04", "role": "Data Scientist", "skill": "Pandas", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "A numeric column contains missing values and calculations produce unexpected results. What should you inspect first?",
     "options": ["The notebook colour", "The column's missing-value count and data type", "The filename", "The number of charts"],
     "answer": 1, "why": "Missing values and incorrect dtypes can directly affect numerical analysis."},

    {"id": "ds-05", "role": "Data Scientist", "skill": "Statistics", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "A sample mean is higher than the population value. What does that alone prove?",
     "options": ["The sample is biased", "Nothing by itself; sampling variation can produce different estimates", "The experiment failed", "The population must be changing"],
     "answer": 1, "why": "Sample statistics naturally vary from population parameters because of sampling variation."},

    {"id": "ds-06", "role": "Data Scientist", "skill": "Statistics", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "An observed correlation between two variables is high. What should you conclude?",
     "options": ["One variable definitely causes the other", "The variables are associated, but causation requires further evidence", "The data is invalid", "The variables are identical"],
     "answer": 1, "why": "Correlation measures association and does not by itself establish causation."},

    {"id": "ds-07", "role": "Data Scientist", "skill": "Machine Learning", "dimension": "Testing", "level": "Intermediate",
     "prompt": "A model performs very well on training data but poorly on unseen validation data. What is the likely issue?",
     "options": ["Overfitting", "Perfect generalisation", "No relationship between features and labels", "Too little training data is guaranteed"],
     "answer": 0, "why": "A large train-validation performance gap is a common sign of overfitting."},

    {"id": "ds-08", "role": "Data Scientist", "skill": "Machine Learning", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "Why should preprocessing parameters such as a scaler be fitted using training data only?",
     "options": ["To make charts prettier", "To prevent information from the validation or test data leaking into training", "To increase the number of features", "To avoid saving the model"],
     "answer": 1, "why": "Fitting preprocessing on held-out data leaks information and makes evaluation optimistic."},

    {"id": "ds-09", "role": "Data Scientist", "skill": "SQL", "dimension": "Application", "level": "Beginner",
     "prompt": "Which SQL clause filters rows before grouping?",
     "options": ["HAVING", "WHERE", "ORDER BY", "GROUP BY"],
     "answer": 1, "why": "WHERE filters individual rows before GROUP BY and aggregate calculations."},

    {"id": "ds-10", "role": "Data Scientist", "skill": "SQL", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "You need customer names and their order counts, including customers with zero orders. Which join is appropriate?",
     "options": ["INNER JOIN", "LEFT JOIN from customers to orders", "CROSS JOIN only", "No join is possible"],
     "answer": 1, "why": "A LEFT JOIN keeps customers even when no matching order exists."},

    {"id": "ds-11", "role": "Data Scientist", "skill": "Visualization", "dimension": "Reasoning", "level": "Beginner",
     "prompt": "You want to show how a numeric variable changes over time. Which chart is usually a strong starting point?",
     "options": ["Line chart", "Pie chart", "Random scatter of categories", "A paragraph of numbers"],
     "answer": 0, "why": "A line chart makes temporal trends and changes easy to inspect."},

    {"id": "ds-12", "role": "Data Scientist", "skill": "Visualization", "dimension": "Application", "level": "Intermediate",
     "prompt": "A chart contains many overlapping points. What can help reveal density?",
     "options": ["Remove all observations", "Use transparency, aggregation or a suitable density representation", "Increase the font size only", "Sort the chart title"],
     "answer": 1, "why": "Transparency and aggregation can make dense regions and patterns more visible."},
]


QUESTIONS += [
    {"id": "da-01", "role": "Data Analyst", "skill": "SQL", "dimension": "Application", "level": "Beginner",
     "prompt": "Which SQL query returns total revenue for each product?",
     "options": ["SELECT product_id, SUM(revenue) FROM sales GROUP BY product_id", "SELECT SUM(revenue) FROM sales", "SELECT DISTINCT product_id FROM sales", "SELECT product_id FROM sales ORDER BY revenue"],
     "answer": 0, "why": "GROUP BY creates one result group per product and SUM calculates its total revenue."},

    {"id": "da-02", "role": "Data Analyst", "skill": "SQL", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "A report suddenly doubles every revenue value after a new join. What should you inspect first?",
     "options": ["The dashboard colour", "Whether the join creates duplicate rows", "The database password", "The report title"],
     "answer": 1, "why": "A one-to-many or many-to-many join can multiply rows and inflate aggregates."},

    {"id": "da-03", "role": "Data Analyst", "skill": "Excel", "dimension": "Application", "level": "Beginner",
     "prompt": "You need to calculate the total of values in cells B2 through B20. Which Excel formula is appropriate?",
     "options": ["=COUNT(B2:B20)", "=SUM(B2:B20)", "=TEXT(B2:B20)", "=SORT(B2:B20)"],
     "answer": 1, "why": "SUM adds the numeric values in the specified range."},

    {"id": "da-04", "role": "Data Analyst", "skill": "Excel", "dimension": "Problem Solving", "level": "Intermediate",
     "prompt": "A lookup returns the wrong customer for some records. What should you check first?",
     "options": ["Whether the lookup key is correct and unique", "Whether the worksheet is dark mode", "Whether the column is hidden", "Whether the workbook has a title"],
     "answer": 0, "why": "Incorrect or non-unique lookup keys are common causes of incorrect matches."},

    {"id": "da-05", "role": "Data Analyst", "skill": "Statistics", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "Averages are strongly affected by a few extremely large values. Which statistic may better describe the typical observation?",
     "options": ["Median", "Maximum", "Count only", "Range only"],
     "answer": 0, "why": "The median is less sensitive to extreme values than the mean."},

    {"id": "da-06", "role": "Data Analyst", "skill": "Statistics", "dimension": "Application", "level": "Intermediate",
     "prompt": "A dashboard reports a percentage increase from 100 to 120. What is the percentage increase?",
     "options": ["10%", "20%", "50%", "120%"],
     "answer": 1, "why": "The increase is 20 divided by the original 100, which is 20%."},

    {"id": "da-07", "role": "Data Analyst", "skill": "Visualization", "dimension": "Application", "level": "Beginner",
     "prompt": "You want to compare sales across five categories. Which chart is usually appropriate?",
     "options": ["Bar chart", "Long paragraph", "Network graph", "Pie chart with hundreds of slices"],
     "answer": 0, "why": "Bars make category magnitude comparisons straightforward."},

    {"id": "da-08", "role": "Data Analyst", "skill": "Visualization", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "A chart starts its y-axis at 95 instead of zero and makes small differences look huge. What issue does this create?",
     "options": ["It can exaggerate visual differences", "It guarantees accurate analysis", "It removes all outliers", "It creates more data"],
     "answer": 0, "why": "A truncated axis can make relatively small differences appear much larger visually."},

    {"id": "da-09", "role": "Data Analyst", "skill": "Pandas", "dimension": "Application", "level": "Intermediate",
     "prompt": "A pandas DataFrame contains sales and region columns. Which operation calculates sales totals by region?",
     "options": ["df.groupby('region')['sales'].sum()", "df.head()", "df.dropna()", "df.sort_index()"],
     "answer": 0, "why": "groupby followed by sum calculates the aggregate sales for each region."},

    {"id": "da-10", "role": "Data Analyst", "skill": "Pandas", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "A date column is stored as strings and sorting produces an incorrect chronological order. What should you do?",
     "options": ["Convert it to a datetime type before sorting", "Reverse the rows manually", "Delete the column", "Convert it to a boolean"],
     "answer": 0, "why": "Datetime values should be represented using a date-aware type for chronological operations."},

    {"id": "da-11", "role": "Data Analyst", "skill": "Statistics", "dimension": "Transfer", "level": "Intermediate",
     "prompt": "A business metric rises after a campaign launches. What additional evidence helps determine whether the campaign caused the change?",
     "options": ["Compare against an appropriate baseline or control and consider other explanations", "Assume causation immediately", "Delete earlier observations", "Only inspect the highest value"],
     "answer": 0, "why": "A comparison baseline or control helps separate campaign effects from other changes."},

    {"id": "da-12", "role": "Data Analyst", "skill": "SQL", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "Why should a data analyst inspect row counts after joining tables?",
     "options": ["To make SQL shorter", "To detect unexpected duplication or row loss", "To change the database password", "To increase chart colours"],
     "answer": 1, "why": "Row-count checks can reveal join mistakes that would otherwise distort analysis."},
]


QUESTIONS += [
    {"id": "be-01", "role": "Backend Developer", "skill": "Python", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "A backend service repeats the same validation logic in several endpoints. What is the better design?",
     "options": ["Copy the validation again", "Centralise reusable validation using schemas or shared functions", "Remove validation", "Validate only after database insertion"],
     "answer": 1, "why": "Centralised validation reduces duplication and makes API behaviour more consistent."},

    {"id": "be-02", "role": "Backend Developer", "skill": "Python", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "A Python API occasionally raises an exception in production but logs contain no useful context. What should you add?",
     "options": ["More print statements visible to users", "Structured logging with useful request or operation context", "A larger logo", "More comments in the README"],
     "answer": 1, "why": "Useful structured logs make production failures traceable without exposing internals to users."},

    {"id": "be-03", "role": "Backend Developer", "skill": "APIs", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "An API creates a new resource successfully. Which HTTP status is commonly appropriate?",
     "options": ["200 or 201, with 201 commonly indicating creation", "404", "401", "500"],
     "answer": 0, "why": "201 Created communicates that a new resource was successfully created."},

    {"id": "be-04", "role": "Backend Developer", "skill": "APIs", "dimension": "Security", "level": "Intermediate",
     "prompt": "An endpoint accepts a user-supplied ID and returns another user's record. What should the server verify?",
     "options": ["Only the ID format", "That the authenticated user is authorised to access the requested resource", "That the browser is Chrome", "Nothing"],
     "answer": 1, "why": "Authentication identifies the caller, while authorization determines whether they may access the resource."},

    {"id": "be-05", "role": "Backend Developer", "skill": "SQL", "dimension": "Application", "level": "Intermediate",
     "prompt": "Why are parameterised SQL queries preferred when values come from users?",
     "options": ["They make queries colourful", "They keep user values separate from SQL code and reduce injection risk", "They eliminate all database errors", "They remove the need for indexes"],
     "answer": 1, "why": "Parameterisation prevents user input from being interpreted as SQL syntax."},

    {"id": "be-06", "role": "Backend Developer", "skill": "SQL", "dimension": "Performance", "level": "Intermediate",
     "prompt": "A query frequently filters by email and is becoming slow as the table grows. What should you investigate?",
     "options": ["Whether an appropriate database index exists", "Whether the UI has animations", "Whether to rename the table", "Whether to remove all constraints"],
     "answer": 0, "why": "An appropriate index can speed up frequent lookup operations."},

    {"id": "be-07", "role": "Backend Developer", "skill": "Authentication", "dimension": "Security", "level": "Intermediate",
     "prompt": "Why should a backend not trust an authentication state maintained only by the browser UI?",
     "options": ["The browser cannot display text", "Clients can be modified or bypassed, so the server must verify credentials or tokens", "Browsers never send requests", "UI state is always encrypted"],
     "answer": 1, "why": "Authorization decisions must be enforced server-side because clients are not trusted."},

    {"id": "be-08", "role": "Backend Developer", "skill": "Authentication", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "A user logs out. What should protected API requests do when their session is no longer valid?",
     "options": ["Continue returning private data", "Reject the request with an authentication error", "Return random data", "Disable the database"],
     "answer": 1, "why": "Expired or invalid credentials must not provide access to protected resources."},

    {"id": "be-09", "role": "Backend Developer", "skill": "Testing", "dimension": "Testing", "level": "Intermediate",
     "prompt": "Which backend test is most useful for an endpoint that creates a user?",
     "options": ["Only test that the page loads", "Test valid creation plus invalid input and important failure paths", "Only inspect the source code", "Only test the CSS"],
     "answer": 1, "why": "API tests should cover successful behaviour and meaningful failure cases."},

    {"id": "be-10", "role": "Backend Developer", "skill": "Testing", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "A test depends on data left behind by another test. What is the problem?",
     "options": ["The tests are coupled and may fail depending on execution order", "The database is always broken", "Tests should never use assertions", "The API is too fast"],
     "answer": 0, "why": "Independent tests are more reliable and should not depend on another test's side effects."},

    {"id": "be-11", "role": "Backend Developer", "skill": "Docker", "dimension": "Deployment", "level": "Intermediate",
     "prompt": "Why package a backend application in Docker?",
     "options": ["To make source code unreadable", "To provide a reproducible runtime environment with declared dependencies", "To remove the need for tests", "To replace authentication"],
     "answer": 1, "why": "Containers package the application and its runtime dependencies consistently."},

    {"id": "be-12", "role": "Backend Developer", "skill": "Docker", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "A Docker image contains development caches and build tools that are unnecessary at runtime. What is a useful improvement?",
     "options": ["Keep everything forever", "Use a smaller final image or multi-stage build", "Copy more caches", "Disable networking"],
     "answer": 1, "why": "Removing build-only dependencies reduces image size and attack surface."},
]


QUESTIONS += [
    {"id": "fs-01", "role": "Full-Stack Developer", "skill": "JavaScript", "dimension": "Application", "level": "Intermediate",
     "prompt": "A browser button needs to update application state after an API call. What JavaScript mechanism is appropriate?",
     "options": ["Update the relevant state after the asynchronous request succeeds", "Reload the entire computer", "Change the database directly from the browser", "Ignore the response"],
     "answer": 0, "why": "Client state should be updated from the result of the asynchronous operation."},

    {"id": "fs-02", "role": "Full-Stack Developer", "skill": "JavaScript", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "An API request sometimes fails but the UI always says it succeeded. What should the frontend do?",
     "options": ["Ignore HTTP failures", "Handle the response status and show an appropriate error state", "Hide the button", "Reload repeatedly"],
     "answer": 1, "why": "The UI should reflect actual server success or failure."},

    {"id": "fs-03", "role": "Full-Stack Developer", "skill": "React", "dimension": "Application", "level": "Beginner",
     "prompt": "A React component needs to keep a value that changes when a user interacts with it. What is commonly used?",
     "options": ["useState", "console.log only", "A CSS class", "An HTML comment"],
     "answer": 0, "why": "React state is designed for values whose changes should trigger a component update."},

    {"id": "fs-04", "role": "Full-Stack Developer", "skill": "React", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "A React effect should fetch data when a selected ID changes. What should the effect depend on?",
     "options": ["The selected ID", "Every CSS class in the application", "Nothing regardless of the ID", "The browser window title only"],
     "answer": 0, "why": "The dependency list should include values whose changes require the effect to run again."},

    {"id": "fs-05", "role": "Full-Stack Developer", "skill": "APIs", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "A frontend sends invalid data to an API. What should the backend do?",
     "options": ["Trust the browser", "Validate the request and return a clear client error", "Write invalid data anyway", "Return success"],
     "answer": 1, "why": "Server-side validation is required because clients cannot be trusted."},

    {"id": "fs-06", "role": "Full-Stack Developer", "skill": "APIs", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "Why should an API return predictable response shapes?",
     "options": ["It makes frontend integration and error handling more reliable", "It prevents all bugs", "It removes the need for authentication", "It makes CSS faster"],
     "answer": 0, "why": "Predictable contracts let clients consume responses consistently."},

    {"id": "fs-07", "role": "Full-Stack Developer", "skill": "SQL", "dimension": "Application", "level": "Intermediate",
     "prompt": "An application needs the five most recent orders. Which SQL approach is appropriate?",
     "options": ["ORDER BY created_at DESC LIMIT 5", "SELECT all rows randomly", "GROUP BY every column", "DELETE older orders"],
     "answer": 0, "why": "Sorting descending by creation time and limiting the result returns the newest five records."},

    {"id": "fs-08", "role": "Full-Stack Developer", "skill": "SQL", "dimension": "Security", "level": "Intermediate",
     "prompt": "A user enters a search term that becomes part of a database query. What should the backend use?",
     "options": ["String concatenation", "Parameterized queries", "A hidden HTML field", "Client-side filtering only"],
     "answer": 1, "why": "Parameterized queries keep user input separate from executable SQL."},

    {"id": "fs-09", "role": "Full-Stack Developer", "skill": "Testing", "dimension": "Testing", "level": "Intermediate",
     "prompt": "A full-stack feature has a backend endpoint and a React form. What testing strategy gives useful coverage?",
     "options": ["Only inspect the UI", "Test backend behaviour and important user flows", "Only test the database schema", "Only run the application manually once"],
     "answer": 1, "why": "Both the API contract and important user interactions need evidence."},

    {"id": "fs-10", "role": "Full-Stack Developer", "skill": "Testing", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "A frontend test passes alone but fails when the entire suite runs. What should you investigate?",
     "options": ["Shared state, cleanup and test isolation", "The monitor brightness", "The README", "The production database"],
     "answer": 0, "why": "Suite-only failures often indicate state leakage or incomplete test cleanup."},

    {"id": "fs-11", "role": "Full-Stack Developer", "skill": "Docker", "dimension": "Deployment", "level": "Intermediate",
     "prompt": "A full-stack application works locally but frontend requests fail in production because the API URL is wrong. What should you check?",
     "options": ["Production environment configuration and API base URL", "Only the database table names", "The logo", "The CSS reset"],
     "answer": 0, "why": "Frontend-to-backend URLs are deployment configuration and must match the production environment."},

    {"id": "fs-12", "role": "Full-Stack Developer", "skill": "Docker", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "Why should a full-stack Docker deployment avoid storing application secrets directly in source files?",
     "options": ["Secrets can be exposed through source control and images", "Docker cannot read strings", "Secrets slow CSS", "It prevents React from compiling"],
     "answer": 0, "why": "Runtime configuration and secret management reduce accidental credential exposure."},
]


QUESTIONS += [
    {"id": "fe-01", "role": "Frontend Developer", "skill": "JavaScript", "dimension": "Application", "level": "Intermediate",
     "prompt": "A click handler needs to use the latest value from component state. What should you ensure?",
     "options": ["The handler has access to the current state through the component's state mechanism", "The value is stored only in CSS", "The browser cache is cleared", "The value is put in the page title"],
     "answer": 0, "why": "Event handlers need access to the current application state when performing updates."},

    {"id": "fe-02", "role": "Frontend Developer", "skill": "JavaScript", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "A promise rejection produces an unhandled error. What should application code do?",
     "options": ["Handle or propagate the rejection intentionally", "Ignore all promises", "Reload the page repeatedly", "Hide the browser console"],
     "answer": 0, "why": "Asynchronous failures need explicit handling so the UI can respond predictably."},

    {"id": "fe-03", "role": "Frontend Developer", "skill": "React", "dimension": "Application", "level": "Beginner",
     "prompt": "Why should a React list use a stable key for each item?",
     "options": ["It helps React track which items correspond across renders", "It changes the database", "It encrypts the item", "It makes CSS unnecessary"],
     "answer": 0, "why": "Stable keys help React reconcile list items correctly."},

    {"id": "fe-04", "role": "Frontend Developer", "skill": "React", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "A React component keeps triggering an effect unexpectedly. What should you inspect first?",
     "options": ["Its dependency values and whether they change identity on each render", "The database password", "The favicon", "The page background"],
     "answer": 0, "why": "Changing effect dependencies, including object or function identities, can cause repeated execution."},

    {"id": "fe-05", "role": "Frontend Developer", "skill": "CSS", "dimension": "Application", "level": "Beginner",
     "prompt": "A layout should adapt from desktop to mobile widths. What CSS feature is commonly useful?",
     "options": ["Media queries and responsive layout techniques", "A fixed width on every element", "JavaScript alerts", "Database triggers"],
     "answer": 0, "why": "Responsive CSS uses flexible layouts and media queries to adapt to viewport sizes."},

    {"id": "fe-06", "role": "Frontend Developer", "skill": "CSS", "dimension": "Problem Solving", "level": "Intermediate",
     "prompt": "Two CSS rules target the same element and the wrong style wins. What should you inspect?",
     "options": ["Specificity, source order and whether another rule overrides it", "The database schema", "The API token", "The image file name"],
     "answer": 0, "why": "CSS conflicts are resolved through the cascade, including specificity and source order."},

    {"id": "fe-07", "role": "Frontend Developer", "skill": "Accessibility", "dimension": "Accessibility", "level": "Intermediate",
     "prompt": "A button contains only an icon. What should make its purpose understandable to screen-reader users?",
     "options": ["An accessible name such as aria-label when visible text is absent", "A random CSS class", "A larger border", "A database ID"],
     "answer": 0, "why": "Icon-only controls need an accessible name describing their action."},

    {"id": "fe-08", "role": "Frontend Developer", "skill": "Accessibility", "dimension": "Accessibility", "level": "Intermediate",
     "prompt": "Why should keyboard users be able to reach interactive controls?",
     "options": ["Keyboard accessibility is essential for users who cannot or do not use a mouse", "It makes images sharper", "It increases database speed", "It removes the need for labels"],
     "answer": 0, "why": "Keyboard access is a core part of accessible interaction."},

    {"id": "fe-09", "role": "Frontend Developer", "skill": "Testing", "dimension": "Testing", "level": "Intermediate",
     "prompt": "A login form has validation, loading and error states. What should a useful UI test cover?",
     "options": ["Only the initial render", "Important user interactions and resulting states", "Only the CSS file", "Only the server database"],
     "answer": 1, "why": "UI tests should verify meaningful behaviour users depend on."},

    {"id": "fe-10", "role": "Frontend Developer", "skill": "Testing", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "A UI test is flaky because it clicks before asynchronous content appears. What should improve it?",
     "options": ["Wait for the relevant condition or UI state instead of relying on arbitrary delays", "Add random sleeps everywhere", "Delete the assertion", "Disable the test"],
     "answer": 0, "why": "Condition-based synchronization is more reliable than arbitrary timing delays."},

    {"id": "fe-11", "role": "Frontend Developer", "skill": "Performance", "dimension": "Performance", "level": "Intermediate",
     "prompt": "A page downloads a very large image that is displayed as a small thumbnail. What is a useful optimization?",
     "options": ["Serve an appropriately sized or optimized image", "Increase its resolution", "Duplicate it", "Convert it to a database row"],
     "answer": 0, "why": "Large unnecessary image payloads increase loading cost."},

    {"id": "fe-12", "role": "Frontend Developer", "skill": "Performance", "dimension": "Performance", "level": "Intermediate",
     "prompt": "A page performs expensive work for content that is far below the fold. What technique may help?",
     "options": ["Lazy-load appropriate content or resources", "Load everything twice", "Disable caching", "Increase the font size"],
     "answer": 0, "why": "Deferring non-critical work can reduce initial page cost."},
]


QUESTIONS += [
    {"id": "do-01", "role": "DevOps Engineer", "skill": "Linux", "dimension": "Problem Solving", "level": "Intermediate",
     "prompt": "A Linux service is not responding. What is a useful first investigation?",
     "options": ["Check service status and relevant logs", "Delete the application", "Restart every server immediately", "Change the hostname"],
     "answer": 0, "why": "Service status and logs provide evidence about what is actually failing."},

    {"id": "do-02", "role": "DevOps Engineer", "skill": "Linux", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "A server disk is almost full. What should you inspect first?",
     "options": ["Disk usage and which directories or files consume space", "The browser theme", "The Git username", "The keyboard layout"],
     "answer": 0, "why": "Usage inspection identifies the actual source of disk consumption."},

    {"id": "do-03", "role": "DevOps Engineer", "skill": "Docker", "dimension": "Deployment", "level": "Intermediate",
     "prompt": "Why pin important application dependencies in a container build?",
     "options": ["To make builds more reproducible", "To make containers invisible", "To remove all security concerns", "To disable networking"],
     "answer": 0, "why": "Pinned dependencies reduce unexpected changes between builds."},

    {"id": "do-04", "role": "DevOps Engineer", "skill": "Docker", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "A container repeatedly exits after starting. What should you inspect first?",
     "options": ["Container logs and its exit status", "The monitor brightness", "The repository README", "The browser cache"],
     "answer": 0, "why": "Logs and exit information reveal why the container process stopped."},

    {"id": "do-05", "role": "DevOps Engineer", "skill": "CI/CD", "dimension": "Deployment", "level": "Intermediate",
     "prompt": "A CI pipeline should prevent deployment when tests fail. Where should the deployment step occur?",
     "options": ["After the test stage succeeds", "Before checkout", "Before installing dependencies", "Regardless of test results"],
     "answer": 0, "why": "Deployment should depend on successful validation."},

    {"id": "do-06", "role": "DevOps Engineer", "skill": "CI/CD", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "A pipeline works on one runner but fails on another. What should you compare?",
     "options": ["Runner OS, tool versions, environment variables and available dependencies", "Only the logo", "The repository description", "The user's monitor"],
     "answer": 0, "why": "Differences in execution environments commonly explain CI inconsistencies."},

    {"id": "do-07", "role": "DevOps Engineer", "skill": "Cloud", "dimension": "Deployment", "level": "Intermediate",
     "prompt": "An application stores data that must survive replacement of its compute instance. Where should persistent data live?",
     "options": ["A persistent storage or managed data service", "Only the instance's temporary filesystem", "Browser local storage", "A log file that is deleted on restart"],
     "answer": 0, "why": "Persistent application data should not depend on ephemeral compute instances."},

    {"id": "do-08", "role": "DevOps Engineer", "skill": "Cloud", "dimension": "Security", "level": "Intermediate",
     "prompt": "A cloud service needs access to one storage bucket. What principle should guide its permissions?",
     "options": ["Least privilege", "Give administrator access to everything", "Disable authentication", "Share one password globally"],
     "answer": 0, "why": "Least privilege limits the blast radius of compromised credentials."},

    {"id": "do-09", "role": "DevOps Engineer", "skill": "Monitoring", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "A service is slow but CPU is normal. What other signals should you inspect?",
     "options": ["Latency, memory, disk, network, dependency and application metrics", "Only CPU again", "The website logo", "The developer's editor theme"],
     "answer": 0, "why": "Service health requires multiple signals rather than a single resource metric."},

    {"id": "do-10", "role": "DevOps Engineer", "skill": "Monitoring", "dimension": "Problem Solving", "level": "Intermediate",
     "prompt": "Why are alerts based only on raw CPU percentage often insufficient?",
     "options": ["CPU alone may not represent user impact or application health", "CPU never changes", "CPU is always private", "Alerts cannot contain thresholds"],
     "answer": 0, "why": "Useful alerts should represent meaningful service conditions and user impact."},

    {"id": "do-11", "role": "DevOps Engineer", "skill": "Scripting", "dimension": "Application", "level": "Intermediate",
     "prompt": "A deployment requires the same sequence of shell commands every time. What is a useful improvement?",
     "options": ["Automate the sequence in a tested script or pipeline", "Type it manually forever", "Delete the deployment", "Run random commands"],
     "answer": 0, "why": "Automation reduces repetitive manual work and makes deployment behaviour repeatable."},

    {"id": "do-12", "role": "DevOps Engineer", "skill": "Scripting", "dimension": "Debugging", "level": "Intermediate",
     "prompt": "A shell script continues after a command fails and produces a misleading success result. What should you consider?",
     "options": ["Use appropriate error handling and fail-fast behaviour where suitable", "Ignore exit codes", "Delete all logging", "Add random delays"],
     "answer": 0, "why": "Scripts should handle command failures explicitly so later steps do not hide the original error."},
]


QUESTIONS += [
    {"id": "cs-01", "role": "Cybersecurity", "skill": "Networking", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "A service is unexpectedly exposed to the public internet. What should you investigate first?",
     "options": ["Network exposure, listening ports and firewall/security-group rules", "The website font", "The user's wallpaper", "The README title"],
     "answer": 0, "why": "Exposure is determined by network listeners and access-control rules."},

    {"id": "cs-02", "role": "Cybersecurity", "skill": "Networking", "dimension": "Problem Solving", "level": "Intermediate",
     "prompt": "A client cannot connect to a service. Which sequence is useful for diagnosis?",
     "options": ["Check DNS/addressing, connectivity, listening port and firewall rules", "Immediately delete the service", "Change the password repeatedly", "Disable all networking"],
     "answer": 0, "why": "Layered network checks help identify where connectivity fails."},

    {"id": "cs-03", "role": "Cybersecurity", "skill": "Linux", "dimension": "Security", "level": "Intermediate",
     "prompt": "A Linux application runs with full administrator privileges even though it does not need them. What should be considered?",
     "options": ["Run it with the minimum privileges required", "Give every process administrator access", "Disable logging", "Remove authentication"],
     "answer": 0, "why": "Least privilege reduces the impact of a compromised process."},

    {"id": "cs-04", "role": "Cybersecurity", "skill": "Linux", "dimension": "Incident Response", "level": "Intermediate",
     "prompt": "You suspect a Linux account was compromised. What is important evidence to inspect?",
     "options": ["Authentication logs, process activity and relevant system events", "Only the desktop wallpaper", "The application logo", "The monitor resolution"],
     "answer": 0, "why": "Authentication and system activity can provide evidence about unauthorized access."},

    {"id": "cs-05", "role": "Cybersecurity", "skill": "Web Security", "dimension": "Security", "level": "Intermediate",
     "prompt": "A web application inserts user input directly into HTML. What vulnerability should you consider?",
     "options": ["Cross-site scripting (XSS)", "Disk fragmentation", "DNS caching only", "CPU overclocking"],
     "answer": 0, "why": "Untrusted input inserted into HTML can enable script injection."},

    {"id": "cs-06", "role": "Cybersecurity", "skill": "Web Security", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "Why should authorization checks be enforced on the server for protected resources?",
     "options": ["Users can modify client-side code and requests", "Browsers cannot display buttons", "CSS cannot be secured", "Servers cannot read requests"],
     "answer": 0, "why": "Client-side controls can be bypassed, so access decisions must be enforced server-side."},

    {"id": "cs-07", "role": "Cybersecurity", "skill": "Cryptography", "dimension": "Security", "level": "Intermediate",
     "prompt": "What is a major reason to use authenticated encryption for sensitive network data?",
     "options": ["It can provide confidentiality and integrity/authenticity", "It makes passwords unnecessary", "It prevents every attack", "It removes the need for access control"],
     "answer": 0, "why": "Authenticated encryption protects confidentiality while also detecting tampering."},

    {"id": "cs-08", "role": "Cybersecurity", "skill": "Cryptography", "dimension": "Reasoning", "level": "Intermediate",
     "prompt": "Why should passwords generally be stored using a password-hashing algorithm rather than reversible encryption?",
     "options": ["The server should not need to recover the original password", "Encryption is always faster", "Hashing makes passwords visible", "It eliminates account security"],
     "answer": 0, "why": "Password verification can be performed without storing recoverable plaintext credentials."},

    {"id": "cs-09", "role": "Cybersecurity", "skill": "Incident Response", "dimension": "Problem Solving", "level": "Intermediate",
     "prompt": "A suspicious login is detected. What should an incident responder establish first?",
     "options": ["What happened, when it happened, which account was involved and what systems were affected", "Only the user's browser version", "The application's colour scheme", "Nothing until the next month"],
     "answer": 0, "why": "Establishing scope and timeline is essential for an effective incident investigation."},

    {"id": "cs-10", "role": "Cybersecurity", "skill": "Incident Response", "dimension": "Adaptation", "level": "Advanced",
     "prompt": "Evidence from a compromised system may be needed later. What is important when collecting it?",
     "options": ["Preserve evidence carefully and document how it was collected", "Modify files freely", "Delete logs immediately", "Share credentials with everyone"],
     "answer": 0, "why": "Evidence handling and documentation help preserve its usefulness for investigation."},

    {"id": "cs-11", "role": "Cybersecurity", "skill": "Scripting", "dimension": "Automation", "level": "Intermediate",
     "prompt": "A security team manually checks thousands of log entries every day. What is a useful improvement?",
     "options": ["Automate repeatable parsing and detection while retaining review for important alerts", "Stop collecting logs", "Delete suspicious entries", "Give every analyst administrator access"],
     "answer": 0, "why": "Automation can reduce repetitive work while human review remains useful for significant findings."},

    {"id": "cs-12", "role": "Cybersecurity", "skill": "Scripting", "dimension": "Engineering", "level": "Intermediate",
     "prompt": "A security script modifies production systems automatically. What should reduce the risk of an incorrect change?",
     "options": ["Validate inputs, log actions and test the script before production use", "Remove all logging", "Allow any input", "Run it without permissions controls"],
     "answer": 0, "why": "Validation, testing and audit logs make security automation safer and traceable."},
]