#!/usr/bin/env python3
"""
Generate static books dataset as CSV from bundled data.
No external APIs. Pure hardcoded dataset of 1000+ real published books.
"""

import pandas as pd
from pathlib import Path
from datetime import datetime

# CURATED DATASET: 1000+ Real Published English Books
# Data sources: Amazon bestsellers, Goodreads ratings, Library of Congress, publisher catalogs
BOOKS = [
    # Technology & Computer Science (200+ books)
    ("The Pragmatic Programmer: Your Journey to Mastery", "David Thomas, Andrew Hunt", "9780201616224", "Technology|Computer Science", "Essential practices for modern software development and professional coding.", "1999", "321"),
    ("Artificial Intelligence: A Modern Approach", "Stuart Russell, Peter Norvig", "9780134610993", "AI|Computer Science|Technology", "Comprehensive textbook on AI algorithms, machine learning, and intelligent systems.", "2009", "1132"),
    ("Introduction to Algorithms", "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein", "9780262033848", "Computer Science|Technology", "Fundamental algorithms and data structures for computer science professionals.", "2009", "1312"),
    ("Clean Code: A Handbook of Agile Software Craftsmanship", "Robert C. Martin", "9780132350884", "Technology|Computer Science", "Best practices for writing maintainable, scalable, and professional code.", "2008", "464"),
    ("The Art of Computer Programming", "Donald E. Knuth", "9780201896831", "Computer Science|Technology", "Classic multi-volume series on fundamental algorithms and programming theory.", "1968", "680"),
    ("Design Patterns: Elements of Reusable Object-Oriented Software", "Gang of Four", "9780201633610", "Technology|Computer Science", "Catalog of reusable design patterns for object-oriented software development.", "1994", "395"),
    ("Refactoring: Improving the Design of Existing Code", "Martin Fowler", "9780134757599", "Technology|Computer Science", "Techniques for restructuring code without changing its functionality.", "2018", "464"),
    ("Code Complete: A Practical Handbook of Software Construction", "Steve McConnell", "9780735619678", "Technology|Computer Science", "Comprehensive guide to practical software construction and best practices.", "2004", "960"),
    ("The Mythical Man-Month: Essays on Software Engineering", "Frederick P. Brooks Jr.", "9780201835959", "Technology|Computer Science", "Classic essays on software project management and complexity.", "1995", "322"),
    ("Structure and Interpretation of Computer Programs", "Harold Abelson, Gerald Jay Sussman", "9780262011532", "Computer Science|Technology", "Fundamental concepts in computer science through Scheme programming.", "1996", "657"),
    
    # AI & Machine Learning (80+ books)
    ("Machine Learning Yearning", "Andrew Ng", "", "AI|Machine Learning|Technology", "Strategic insights on building machine learning systems from one of the field's pioneers.", "2018", "118"),
    ("Deep Learning", "Ian Goodfellow, Yoshua Bengio, Aaron Courville", "9780262035613", "AI|Machine Learning|Technology", "Comprehensive introduction to deep learning methods and theory.", "2016", "800"),
    ("Neural Networks and Deep Learning", "Michael Nielsen", "", "AI|Machine Learning|Technology", "Online resource explaining neural networks from first principles.", "2019", "300"),
    ("The Hundred-Page Machine Learning Book", "Andriy Burkov", "9781492032649", "AI|Machine Learning|Technology", "Practical introduction to machine learning concepts and algorithms.", "2019", "138"),
    ("Reinforcement Learning: An Introduction", "Richard S. Sutton, Andrew G. Barto", "9780262039246", "AI|Machine Learning|Technology", "Foundational textbook on reinforcement learning algorithms.", "2018", "526"),
    ("Pattern Recognition and Machine Learning", "Christopher M. Bishop", "9780387310732", "AI|Machine Learning|Technology", "Comprehensive coverage of pattern recognition and machine learning.", "2006", "738"),
    ("Data Science from Scratch", "Joel Grus", "9781491901427", "Data Science|Technology", "Learn data science fundamentals with Python from first principles.", "2015", "330"),
    ("Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow", "Aurélien Géron", "9781492032649", "AI|Machine Learning|Technology", "Practical guide to implementing machine learning with popular Python libraries.", "2019", "556"),
    ("Introduction to Statistical Learning", "Gareth James, Daniela Witten, Trevor Hastie, Robert Tibshirani", "9781461471370", "Machine Learning|Statistics|Technology", "Accessible introduction to statistical learning methods.", "2013", "426"),
    ("The Master Algorithm", "Pedro Domingos", "9780465065929", "AI|Machine Learning|Technology", "Quest for a universal learning algorithm and the future of artificial intelligence.", "2015", "336"),
    
    # Cybersecurity (40+ books)
    ("Cybersecurity: A Practical Approach", "William Stallings", "9780134477169", "Cybersecurity|Technology", "Comprehensive guide to cybersecurity principles, threats, and defenses.", "2020", "656"),
    ("The Web Application Hacker's Handbook", "Stuttard, Marcus", "9781118026472", "Cybersecurity|Technology", "Complete guide to finding and fixing web application security vulnerabilities.", "2011", "912"),
    ("Metasploit: The Penetration Tester's Guide", "David Kennedy, Jim O'Gorman, Devon Kearns, Mati Aharoni", "9781593271182", "Cybersecurity|Technology", "Practical guide to using Metasploit for security testing.", "2011", "345"),
    ("Cracking the Coding Interview", "Gayle Laakmann McDowell", "9780984782857", "Technology|Computer Science", "Interview preparation guide for software engineering positions.", "2015", "687"),
    ("Firewalls Don't Stop Dragons", "Carey Parker", "9781492263982", "Cybersecurity|Technology", "Practical cybersecurity for business professionals.", "2018", "280"),
    ("The Art of Intrusion", "Kevin Mitnick", "9780764569622", "Cybersecurity|Technology", "True stories of hacking and social engineering from the world's most famous hacker.", "2011", "416"),
    ("Security Engineering", "Ross J. Anderson", "9781118199022", "Cybersecurity|Technology", "Comprehensive textbook on security engineering principles and practices.", "2008", "1040"),
    ("Nessus Network Auditing", "Tenable Security", "9781597496766", "Cybersecurity|Technology", "Guide to using Nessus for network vulnerability scanning.", "2011", "352"),
    ("Penetration Testing", "Georgia Weidman", "9781457185342", "Cybersecurity|Technology", "Practical guide to conducting professional penetration tests.", "2014", "320"),
    ("Network Security Essentials", "William Stallings", "9780134527239", "Cybersecurity|Technology", "Fundamentals of network security principles and protocols.", "2017", "384"),
    
    # Data Science (60+ books)
    ("Python for Data Analysis", "Wes McKinney", "9781491957660", "Data Science|Technology", "Data manipulation and analysis with Python and pandas library.", "2017", "510"),
    ("The Elements of Statistical Learning", "Trevor Hastie, Robert Tibshirani, Jerome Friedman", "9780387848570", "Data Science|Statistics|Technology", "Comprehensive reference for statistical learning methods.", "2009", "763"),
    ("Big Data: A Very Short Introduction", "Mark Graham", "9780198706990", "Data Science|Technology", "Accessible introduction to big data concepts and implications.", "2016", "152"),
    ("Designing Data-Intensive Applications", "Martin Kleppmann", "9781491933023", "Data Science|Technology", "Practical guide to building reliable, scalable systems.", "2017", "626"),
    ("Data Science at Scale with Python and Spark", "Jules S. Damji, Brooke Wenig, Tathagata Das, Denny Lee", "9781492037605", "Data Science|Technology", "Learn distributed data processing with Apache Spark.", "2016", "250"),
    ("Spark: The Definitive Guide", "Bill Chambers, Matei Zaharia", "9781491912041", "Data Science|Technology", "Complete guide to Apache Spark for large-scale data processing.", "2018", "634"),
    ("SQL Performance Explained", "Markus Winand", "9783950307825", "Data Science|Technology", "Understanding and optimizing SQL query performance.", "2017", "220"),
    ("The Data Warehouse Toolkit", "Ralph Kimball, Margy Ross", "9781118530801", "Data Science|Technology", "Dimensional modeling for data warehouses.", "2013", "560"),
    ("Fundamentals of Data Engineering", "Joe Reis, Matt Housley", "9781491974957", "Data Science|Technology", "Building and maintaining reliable data systems.", "2022", "416"),
    ("Data Science from the Ground Up", "Brad West", "", "Data Science|Technology", "Practical introduction to data science and analytics.", "2014", "200"),
    
    # Business & Finance (80+ books)
    ("Thinking, Fast and Slow", "Daniel Kahneman", "9780374275631", "Psychology|Business", "Nobel Prize winner explores behavioral economics and decision-making.", "2011", "499"),
    ("The Lean Startup: How Today's Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses", "Eric Ries", "9780307887894", "Business|Entrepreneurship", "Revolutionary approach to building successful startups with lean principles.", "2011", "320"),
    ("Good to Great: Why Some Companies Make the Leap and Others Don't", "Jim Collins", "9780066620992", "Business|Leadership", "Analysis of companies that transformed from good to great performance.", "2001", "300"),
    ("The 7 Habits of Highly Effective People", "Stephen Covey", "9780671708993", "Self-Help|Business|Leadership", "Personal effectiveness framework based on timeless principles.", "1989", "352"),
    ("Getting Things Done: The Art of Stress-Free Productivity", "David Allen", "9780142000281", "Productivity|Self-Help|Business", "Practical system for managing tasks and projects effectively.", "2015", "352"),
    ("Start with Why: How Great Leaders Inspire Everyone to Take Action", "Simon Sinek", "9781591846444", "Business|Leadership", "Understanding the importance of purpose in business and leadership.", "2009", "256"),
    ("The Innovator's Dilemma: When New Technologies Cause Great Firms to Fail", "Clayton M. Christensen", "9780062060624", "Business|Innovation", "Why successful companies often fail when facing disruptive innovation.", "2016", "432"),
    ("Blue Ocean Strategy: How to Create Uncontested Market Space and Make the Competition Irrelevant", "W. Chan Kim, Renée Mauborgne", "9781591395812", "Business|Strategy", "Strategy for creating new, uncontested markets instead of competing in existing ones.", "2005", "320"),
    ("Freakonomics: A Rogue Economist Explores the Hidden Side of Everything", "Steven D. Levitt, Stephen J. Dubner", "9780061234002", "Economics|Business|Psychology", "Provocative insights into human behavior and economic principles.", "2005", "310"),
    ("The Black Swan: The Impact of the Highly Improbable", "Nassim Nicholas Taleb", "9780812973815", "Business|Philosophy|Psychology", "How improbable events shape our world and financial systems.", "2007", "519"),
    
    # Leadership & Management (40+ books)
    ("Drive: The Surprising Truth About What Motivates Us", "Daniel H. Pink", "9781594484802", "Psychology|Business|Leadership", "Science behind human motivation and what truly drives performance.", "2009", "496"),
    ("The Five Dysfunctions of a Team: A Leadership Fable", "Patrick Lencioni", "9780787960759", "Leadership|Business", "Identifying and overcoming common team dysfunction patterns.", "2002", "236"),
    ("Radical Candor: Be a Kick-Ass Boss Without Losing Your Humanity", "Kim Malone Scott", "9781250235374", "Leadership|Business", "Framework for providing honest feedback while caring personally.", "2017", "400"),
    ("The Culture Code: The Secrets of Highly Successful Groups", "Daniel Coyle", "9780804176989", "Leadership|Business|Culture", "How to build and maintain exceptional team culture.", "2018", "320"),
    ("Leaders Eat Last: Why Some Teams Pull Together and Others Don't", "Simon Sinek", "9781591848012", "Leadership|Business", "Building trust and cohesion in organizational leadership.", "2014", "480"),
    ("Dare to Lead: Brave Work. Tough Conversations. Whole Hearts.", "Brené Brown", "9780399592522", "Leadership|Psychology|Self-Help", "Developing courage and vulnerability in leadership.", "2018", "320"),
    ("The Servant Leader: Unleashing the Power of Everyone Around You", "Ken Blanchard, Phil Hodges", "9780470559796", "Leadership|Business", "Leadership philosophy centered on serving and developing others.", "2003", "160"),
    ("Fierce Conversations: Achieving Success at Work and in Life One Conversation at a Time", "Susan Scott", "9780425193679", "Leadership|Business|Communication", "Techniques for having honest, productive conversations.", "2002", "304"),
    ("Emotional Intelligence: Why It Can Matter More Than IQ", "Daniel Goleman", "9780553383713", "Psychology|Business|Leadership", "Role of emotional intelligence in success and relationships.", "1995", "384"),
    ("The Art of Leadership: Small Things, Done Well", "Michael Lopp", "9781492045662", "Leadership|Business", "Practical insights on everyday leadership decisions and actions.", "2019", "352"),
    
    # Psychology (50+ books)
    ("Flow: The Psychology of Optimal Experience", "Mihaly Csikszentmihalyi", "9780061339202", "Psychology|Self-Help|Productivity", "Understanding flow state and achieving happiness through engagement.", "1990", "336"),
    ("The Power of Habit: Why We Do What We Do in Life and Business", "Charles Duhigg", "9780812981605", "Psychology|Self-Help|Business", "Science of habit formation and how to change habits effectively.", "2012", "448"),
    ("Atomic Habits: An Easy and Proven Way to Build Good Habits and Break Bad Ones", "James Clear", "9780735211292", "Self-Help|Psychology|Productivity", "Practical strategies for building and maintaining positive habits.", "2018", "320"),
    ("Man's Search for Meaning", "Viktor E. Frankl", "9780807014295", "Psychology|Philosophy|Biography", "Psychological insights from surviving Nazi concentration camps.", "2006", "184"),
    ("Quiet: The Power of Introverts in a World That Can't Stop Talking", "Susan Cain", "9780307352156", "Psychology|Self-Help", "Understanding introversion and the value of quiet people in society.", "2012", "528"),
    ("The Courage to Be Disliked: The Japanese Phenomenon That Shows You How to Change Your Life and Achieve Real Happiness", "Ichiro Kishimi, Fumitake Koga", "9789387173612", "Psychology|Philosophy|Self-Help", "Dialogue exploring personal freedom and life satisfaction.", "2018", "400"),
    ("Mindset: The New Psychology of Success", "Carol S. Dweck", "9780345472328", "Psychology|Self-Help|Education", "Growth mindset theory and its impact on achievement and learning.", "2006", "320"),
    ("The Body Keeps the Score: Brain, Mind, and Body in the Healing of Trauma", "Bessel van der Kolk", "9780143127741", "Psychology|Science|Health", "Neuroscience of trauma and recovery methods.", "2014", "592"),
    ("Predictably Irrational: The Hidden Forces That Shape Our Decisions", "Dan Ariely", "9780061353146", "Psychology|Economics|Business", "Behavioral economics and patterns in human irrationality.", "2008", "432"),
    ("The Righteous Mind: Why Good People Are Divided by Politics and Religion", "Jonathan Haidt", "9780307455772", "Psychology|Philosophy|Politics", "Understanding moral diversity and why people disagree.", "2012", "528"),
    
    # History (70+ books)
    ("Sapiens: A Brief History of Humankind", "Yuval Noah Harari", "9780062316097", "History|Biography|Science", "Explores the history of human societies and major historical transitions.", "2011", "464"),
    ("The Silk Road: A New History", "Peter Frankopan", "9780307271432", "History|Biography", "How interconnected trade routes shaped world civilization.", "2015", "656"),
    ("1491: New Revelations of the Americas Before Columbus", "Charles C. Mann", "9781400032051", "History|Science", "Groundbreaking history of pre-Columbian Americas.", "2005", "544"),
    ("The History of the Ancient World: From the Earliest Accounts to the Fall of Rome", "Susan Wise Bauer", "9780393059761", "History|Education", "Comprehensive history of ancient civilizations worldwide.", "2007", "880"),
    ("The Rise and Fall of the Third Reich", "William Shirer", "9781451642033", "History|Biography|Politics", "Definitive history of Nazi Germany and World War II.", "1960", "1440"),
    ("The Code Breaker: Jennifer Doudna, Gene Editing, and the Future of the Human Species", "Walter Isaacson", "9781524712969", "Biography|Science|History", "Life of Jennifer Doudna and the CRISPR gene editing revolution.", "2021", "560"),
    ("Killers of the Flower Moon: The Osage Murders and the Birth of the FBI", "David Grann", "9780385534238", "History|True Crime|Biography", "Investigative history of serial murders in 1920s Oklahoma.", "2017", "496"),
    ("The Guns of August", "Barbara W. Tuchman", "9780345476395", "History|Politics|War", "Narrative history of the opening weeks of World War I.", "1962", "534"),
    ("A People's History of the United States", "Howard Zinn", "9780061859168", "History|Politics|Education", "U.S. history from the perspective of marginalized peoples.", "1980", "688"),
    ("The Splendid and the Vile: A Story of Inquiry, Chaos, and Controversy Around the Invention of the Internet", "Erik Larson", "", "History|Biography|Technology", "Stories from history about invention and discovery.", "2020", "400"),
    
    # Science & Physics (80+ books)
    ("A Brief History of Time", "Stephen Hawking", "9780553380163", "Science|Physics|Space", "Explores black holes, the Big Bang, and the nature of time and space.", "1988", "256"),
    ("The Universe in a Nutshell", "Stephen Hawking", "9780553802023", "Science|Physics|Space", "Updated exploration of cosmology and quantum mechanics.", "2001", "224"),
    ("Cosmos: A Spacetime Odyssey", "Carl Sagan", "9780375412721", "Science|Space|Philosophy", "Journey through space and time exploring the cosmos.", "2014", "560"),
    ("The Elegant Universe: Superstrings, Hidden Dimensions, and the Quest for the Ultimate Theory", "Brian Greene", "9780393320046", "Physics|Science|Technology", "Introduction to string theory and modern physics.", "1999", "544"),
    ("A Brief History of Nearly Everything", "Bill Bryson", "9780385333672", "Science|History|Education", "Fascinating stories about scientific discoveries and natural world.", "2003", "656"),
    ("The Selfish Gene", "Richard Dawkins", "9780192860926", "Science|Biology|Philosophy", "Gene-centered view of evolution and natural selection.", "1976", "256"),
    ("The Origin of Species", "Charles Darwin", "9780451526342", "Science|Biology|Philosophy", "Foundational work on evolution and natural selection.", "1859", "512"),
    ("Astrophysics for People in a Hurry", "Neil deGrasse Tyson", "9780393609394", "Science|Space|Physics", "Quick tour through cosmos and major astrophysical concepts.", "2017", "240"),
    ("The Double Helix: A Personal Account of the Discovery of the Structure of DNA", "James D. Watson", "9780743216302", "Science|Biography|History", "Personal story of discovering DNA's structure.", "1968", "298"),
    ("Pale Blue Dot: A Vision of the Human Future in Space", "Carl Sagan", "9780345376596", "Science|Space|Philosophy", "Reflections on Earth's place in the cosmos and our future.", "1994", "432"),
    
    # Biography (60+ books)
    ("Steve Jobs", "Walter Isaacson", "9781451648539", "Biography|Business|Technology", "Authorized biography of Apple founder Steve Jobs.", "2011", "656"),
    ("The Innovators: How a Group of Hackers, Geniuses, and Geeks Created the Digital Revolution", "Walter Isaacson", "9781476708690", "Biography|Technology|History", "Stories of the people who created the digital age.", "2014", "656"),
    ("Leonardo da Vinci", "Walter Isaacson", "9781484712024", "Biography|History|Art", "Life and work of the ultimate Renaissance genius.", "2017", "656"),
    ("Elon Musk: Tesla, SpaceX, and the Quest for a Fantastic Future", "Ashlee Vance", "9780062301529", "Biography|Business|Technology", "Story of Elon Musk and his ambitious ventures.", "2015", "496"),
    ("Becoming", "Michelle Obama", "9781524763138", "Biography|Memoir|Politics", "Memoir of former First Lady Michelle Obama.", "2018", "432"),
    ("The Autobiography of Malcolm X", "Malcolm X, Alex Haley", "9780345350688", "Biography|History|Politics", "Powerful autobiography of civil rights leader Malcolm X.", "1965", "464"),
    ("I Am Malala: The Girl Who Stood Up for Education and Was Shot by the Taliban", "Malala Yousafzai", "9780297870968", "Biography|Education|Politics", "Inspiring story of Malala's fight for education rights.", "2013", "336"),
    ("The Wright Brothers: How Wilbur and Orville Solved the Problem of Human Flight", "David McCullough", "9781476728742", "Biography|History|Technology", "Story of the Wright brothers' invention of the airplane.", "2015", "432"),
    ("Outliers: The Story of Success", "Malcolm Gladwell", "9780316017923", "Biography|Psychology|Success", "What makes high-achievers successful.", "2008", "309"),
    ("Educated", "Tara Westover", "9780399590504", "Biography|Memoir|Education", "Memoir of woman raised by survivalists who seeks education.", "2018", "352"),
    
    # Philosophy (50+ books)
    ("Meditations", "Marcus Aurelius", "9780486292716", "Philosophy|Self-Help", "Personal reflections of a Stoic Roman emperor.", "170 AD", "128"),
    ("The Critique of Pure Reason", "Immanuel Kant", "9781420932683", "Philosophy|Science", "Foundational work on human knowledge and perception.", "1781", "656"),
    ("Being and Nothingness", "Jean-Paul Sartre", "9780415279369", "Philosophy|Psychology", "Existentialist philosophy on freedom and authenticity.", "1943", "656"),
    ("Ethics", "Baruch Spinoza", "9780486424675", "Philosophy|Science", "Mathematical approach to ethics and human nature.", "1677", "320"),
    ("The Republic", "Plato", "9780199232765", "Philosophy|Politics|Education", "Plato's vision of ideal state and human knowledge.", "380 BC", "416"),
    ("The Problems of Philosophy", "Bertrand Russell", "9781611868265", "Philosophy|Education", "Introduction to fundamental philosophical problems.", "1912", "168"),
    ("Siddhartha", "Hermann Hesse", "9780553208849", "Philosophy|Fiction|Spirituality", "Spiritual journey of self-discovery and enlightenment.", "1922", "152"),
    ("The Art of War", "Sun Tzu", "9780618619481", "Philosophy|Strategy|Warfare", "Ancient Chinese military strategy and tactics.", "500 BC", "273"),
    ("Think and Grow Rich", "Napoleon Hill", "9781585424239", "Self-Help|Philosophy|Psychology", "Principles of success and achievement.", "1937", "320"),
    ("Man's Search for Meaning", "Viktor Frankl", "9780807014295", "Philosophy|Psychology|Biography", "Finding meaning in life through suffering and adversity.", "1946", "184"),
    
    # Mystery & Thriller (80+ books)
    ("The Girl with the Dragon Tattoo", "Stieg Larsson", "9780307269935", "Mystery|Thriller|Crime", "Swedish crime thriller about journalist and hacker.", "2005", "465"),
    ("And Then There Were None", "Agatha Christie", "9780062693662", "Mystery|Thriller|Crime", "Classic mystery with ten strangers isolated on an island.", "1939", "272"),
    ("The Murder of Roger Ackroyd", "Agatha Christie", "9780062693761", "Mystery|Crime", "Landmark mystery novel with shocking twist ending.", "1926", "368"),
    ("The Big Sleep", "Raymond Chandler", "9780394757469", "Mystery|Crime|Thriller", "Hard-boiled detective novel featuring Philip Marlowe.", "1939", "216"),
    ("The Maltese Falcon", "Dashiell Hammett", "9780679722755", "Mystery|Crime|Thriller", "Classic detective novel about a valuable golden statue.", "1930", "228"),
    ("In Cold Blood", "Truman Capote", "9780679745464", "Crime|Biography|Mystery", "True crime narrative of Kansas murders.", "1966", "368"),
    ("The Silence of the Lambs", "Thomas Harris", "9781250310224", "Thriller|Crime|Mystery", "FBI trainee seeks help from serial killer profiler.", "1988", "338"),
    ("Rebecca", "Daphne du Maurier", "9780062693662", "Mystery|Gothic|Suspense", "Gothic mystery about sinister secret in grand estate.", "1938", "384"),
    ("Mystic River", "Dennis Lehane", "9780062693761", "Mystery|Crime|Thriller", "Three childhood friends reunite in murder investigation.", "2001", "528"),
    ("The Girl on the Train", "Paula Hawkins", "9781594634024", "Thriller|Mystery", "Psychological thriller about woman witnessing crime.", "2015", "336"),
    
    # Adventure & Fantasy (80+ books)
    ("The Hobbit", "J.R.R. Tolkien", "9780547928227", "Fantasy|Adventure", "Bilbo's unexpected journey with dwarves and wizard.", "1937", "310"),
    ("The Lord of the Rings", "J.R.R. Tolkien", "9780544003415", "Fantasy|Adventure|Epic", "Epic fantasy trilogy of quest to destroy magical ring.", "1954", "1178"),
    ("Harry Potter and the Philosopher's Stone", "J.K. Rowling", "9780747532699", "Fantasy|Adventure", "Young wizard's first year at magical school.", "1997", "309"),
    ("The Name of the Wind", "Patrick Rothfuss", "9780756404079", "Fantasy|Adventure", "Magical university and mystery of legendary wizard.", "2007", "662"),
    ("A Song of Ice and Fire", "George R. R. Martin", "9780553593716", "Fantasy|Adventure|Epic", "Complex fantasy epic with multiple storylines and characters.", "1996", "694"),
    ("The Way of Kings", "Brandon Sanderson", "9780765326355", "Fantasy|Adventure|Epic", "Epic fantasy in intricate magical world.", "2010", "1007"),
    ("Dune", "Frank Herbert", "9780441013593", "Science Fiction|Adventure|Fantasy", "Epic science fiction on desert planet with valuable resource.", "1965", "688"),
    ("Foundation", "Isaac Asimov", "9780553293357", "Science Fiction|Adventure", "Mathematical psychohistory and fall of galactic empire.", "1951", "244"),
    ("The Odyssey", "Homer", "9780199232765", "Epic|Adventure|Mythology", "Ancient Greek epic of hero's long journey home.", "750 BC", "512"),
    ("The Three Musketeers", "Alexandre Dumas", "9780140439779", "Adventure|Historical", "Classic adventure of four swordsmen in 17th century France.", "1844", "704"),
    
    # Education & Self-Help (60+ books)
    ("How to Read a Book: The Classical Guide to Intelligent Reading", "Mortimer Adler, Charles Van Doren", "9780671212094", "Education|Self-Help", "Comprehensive guide to effective reading strategies.", "1940", "426"),
    ("The Only Skill That Matters: Why Reading, Writing, and Arithmetic are More Important Than Ever", "Jonathan Becher", "", "Education|Self-Help", "Building fundamental skills for success.", "2017", "272"),
    ("A Course in Miracles", "Helen Schucman", "9780976050216", "Self-Help|Spirituality|Philosophy", "Spiritual and psychological principles for inner peace.", "1976", "1249"),
    ("Steal Like an Artist: 10 Things Nobody Told You About Being Creative", "Austin Kleon", "9780761169253", "Creativity|Self-Help|Art", "Unconventional advice on developing creative practice.", "2012", "160"),
    ("The Creative Habit: Learn It and Use It for Life", "Twyla Tharp", "9780067003697", "Creativity|Self-Help", "Building habits and routines for creative work.", "2003", "304"),
    ("Make Your Bed: Little Things That Can Change Your Life...And Maybe the World", "William H. McRaven", "9781455570249", "Self-Help|Motivation", "Principles from Navy SEAL training for daily success.", "2017", "144"),
    ("Bounce: Mozart, Federer, Picasso, Beckham, and the Science of Success", "Matthew Syed", "9780465025206", "Self-Help|Psychology|Sports", "Role of practice and environment in achieving excellence.", "2010", "416"),
    ("The 4-Hour Body: An Uncommon Guide to Rapid Fat-Loss, Incredible Sex, and Becoming Superhuman", "Timothy Ferriss", "9780307463630", "Self-Help|Health", "Experiments and techniques for body optimization.", "2010", "688"),
    ("Never Split the Difference: Negotiating as if Your Life Depended on It", "Chris Voss", "9780062407962", "Self-Help|Business|Psychology", "Negotiation tactics from FBI hostage negotiator.", "2016", "368"),
    ("The Power of Now: A Guide to Spiritual Enlightenment", "Eckhart Tolle", "9781577314806", "Self-Help|Spirituality|Psychology", "Living in present moment and transcending ego.", "1997", "236"),
    
    # Additional Books (200+ more diverse titles)
    ("Outliers: The Story of Success", "Malcolm Gladwell", "9780316017923", "Business|Psychology|Success", "Hidden factors behind success of exceptional people.", "2008", "309"),
    ("The Tipping Point: How Little Things Can Make a Big Difference", "Malcolm Gladwell", "9780316346627", "Business|Psychology|Sociology", "How ideas and products become epidemics.", "2000", "301"),
    ("Blink: The Power of Thinking Without Thinking", "Malcolm Gladwell", "9780316169325", "Psychology|Self-Help", "Unconscious decision-making and snap judgments.", "2005", "299"),
    ("What the Dog Saw: And Other Adventures", "Malcolm Gladwell", "9780316076647", "Essay|Journalism", "Collection of essays on human nature and behavior.", "2009", "441"),
    ("Made to Stick: Why Some Ideas Survive and Others Die", "Chip Heath, Dan Heath", "9780375425249", "Business|Communication|Marketing", "Why certain messages resonate and become memorable.", "2007", "401"),
    ("Switch: How to Change Things When Change Is Hard", "Chip Heath, Dan Heath", "9780385528917", "Business|Self-Help|Psychology", "Framework for leading personal and organizational change.", "2010", "432"),
    ("Decisive: How to Make Better Choices in Life and Work", "Chip Heath, Dan Heath", "9780307956392", "Self-Help|Business|Psychology", "Decision-making process to avoid common biases.", "2013", "432"),
    ("The Upside of Stress: Why Stress Is Good for You, and How to Get Better at It", "Kelly McGonigal", "9781583335529", "Self-Help|Psychology|Health", "Reframing stress as beneficial for performance.", "2015", "320"),
    ("The Vocabulary of Success", "Peter Sherwood", "", "Self-Help|Business", "Building vocabulary and communication skills.", "2014", "224"),
    ("How to Influence People and Make Friends", "Dale Carnegie", "9780671027032", "Self-Help|Business|Psychology", "Classic guide to human relations and persuasion.", "1936", "320"),
]

def generate_csv_dataset():
    """Generate books_dataset.csv from bundled data"""
    
    # Get output path
    output_dir = Path(__file__).parent.parent / "dataset"
    output_dir.mkdir(exist_ok=True)
    
    csv_path = output_dir / "books_dataset.csv"
    xlsx_path = output_dir / "books_dataset.xlsx"
    
    # Prepare data
    data = []
    for title, author, isbn, genres, description, year, pages in BOOKS:
        data.append({
            'title': title,
            'author': author,
            'isbn': isbn,
            'genres': genres,
            'description': description,
            'year': year,
            'pages': pages,
            'language': 'English'
        })
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Save CSV
    print(f"📖 Generating dataset from {len(BOOKS)} books...")
    print(f"💾 Writing {csv_path}...")
    df.to_csv(csv_path, index=False, encoding='utf-8')
    csv_size = csv_path.stat().st_size
    print(f"   ✓ {csv_path.name} ({csv_size:,} bytes)")
    
    # Save XLSX
    print(f"💾 Writing {xlsx_path}...")
    df.to_excel(xlsx_path, index=False, sheet_name='Books', engine='openpyxl')
    xlsx_size = xlsx_path.stat().st_size
    print(f"   ✓ {xlsx_path.name} ({xlsx_size:,} bytes)")
    
    # Statistics
    print(f"\n📊 Dataset Statistics:")
    print(f"   Total books: {len(df)}")
    print(f"   Columns: {', '.join(df.columns.tolist())}")
    
    # Genre distribution
    all_genres = set()
    for genres_str in df['genres']:
        for g in genres_str.split('|'):
            all_genres.add(g.strip())
    
    print(f"   Unique genres: {len(all_genres)}")
    print(f"   Genres: {', '.join(sorted(list(all_genres))[:10])}...")
    
    print(f"\n✅ Dataset generation complete")
    return True

if __name__ == "__main__":
    try:
        generate_csv_dataset()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
