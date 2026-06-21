// Section headings keyed by [bookId][chapter][startVerse].
// Headings are generic passage-title descriptions that appear consistently
// across many Bible editions and commentaries.
type HeadingMap = Record<number, Record<number, Record<number, string>>>;

export const SECTION_HEADINGS: HeadingMap = {
  // Genesis (1)
  1: {
    1: { 1: "The Creation" },
    2: { 1: "The Garden of Eden", 18: "The First Woman" },
    3: { 1: "The Fall", 14: "God's Judgment", 20: "Expelled from Eden" },
    4: { 1: "Cain and Abel", 17: "The Line of Cain", 25: "Seth and Enosh" },
    5: { 1: "The Descendants of Adam" },
    6: { 1: "Wickedness in the World", 9: "Noah Builds the Ark" },
    7: { 1: "The Flood Begins" },
    8: { 1: "The Waters Recede", 20: "Noah's Altar" },
    9: { 1: "God's Covenant with Noah", 18: "Noah and His Sons" },
    10: { 1: "The Table of Nations" },
    11: { 1: "The Tower of Babel", 10: "Shem's Descendants", 27: "Terah's Family" },
    12: { 1: "The Call of Abram", 10: "Abram in Egypt" },
    13: { 1: "Abram and Lot Separate" },
    14: { 1: "Abram Rescues Lot", 17: "Melchizedek Blesses Abram" },
    15: { 1: "God's Covenant with Abram" },
    16: { 1: "Hagar and Ishmael" },
    17: { 1: "The Covenant of Circumcision" },
    18: { 1: "The Three Visitors", 16: "Abraham Intercedes for Sodom" },
    19: { 1: "The Destruction of Sodom", 30: "Lot and His Daughters" },
    21: { 1: "The Birth of Isaac", 8: "Hagar and Ishmael Sent Away", 22: "Abraham and Abimelech" },
    22: { 1: "The Offering of Isaac" },
    24: { 1: "A Wife for Isaac" },
    25: { 1: "Abraham's Death", 19: "Jacob and Esau" },
    27: { 1: "Jacob Takes Esau's Blessing" },
    28: { 10: "Jacob's Dream at Bethel" },
    29: { 1: "Jacob Arrives at Laban's Home" },
    37: { 1: "Joseph and His Brothers" },
    39: { 1: "Joseph in Potiphar's House" },
    40: { 1: "Joseph Interprets Two Dreams" },
    41: { 1: "Pharaoh's Dreams", 37: "Joseph Put in Charge" },
    45: { 1: "Joseph Reveals Himself" },
    50: { 1: "The Burial of Jacob", 15: "Joseph Reassures His Brothers" },
  },

  // Exodus (2)
  2: {
    1: { 1: "Israel Oppressed in Egypt" },
    2: { 1: "The Birth of Moses" },
    3: { 1: "Moses and the Burning Bush", 13: "I AM WHO I AM" },
    4: { 1: "Signs for Moses" },
    5: { 1: "Bricks Without Straw" },
    7: { 14: "The Plague of Blood" },
    12: { 1: "The Passover", 31: "The Exodus from Egypt" },
    14: { 1: "Crossing the Red Sea" },
    15: { 1: "The Song of Moses" },
    16: { 1: "Manna and Quail" },
    17: { 1: "Water from the Rock", 8: "The Amalekites Defeated" },
    19: { 1: "At Mount Sinai" },
    20: { 1: "The Ten Commandments" },
    24: { 1: "The Covenant Confirmed" },
    32: { 1: "The Golden Calf" },
    34: { 1: "The New Stone Tablets" },
  },

  // Leviticus (3)
  3: {
    16: { 1: "The Day of Atonement" },
    19: { 1: "Various Laws", 18: "Love Your Neighbor as Yourself" },
  },

  // Numbers (4)
  4: {
    6: { 22: "The Priestly Blessing" },
    22: { 1: "Balaam and His Donkey" },
  },

  // Deuteronomy (5)
  5: {
    5: { 1: "The Ten Commandments" },
    6: { 1: "The Greatest Commandment" },
    8: { 1: "Do Not Forget the Lord" },
    28: { 1: "Blessings for Obedience", 15: "Curses for Disobedience" },
    34: { 1: "The Death of Moses" },
  },

  // Joshua (6)
  6: {
    1: { 1: "The Lord Commands Joshua" },
    2: { 1: "Rahab and the Spies" },
    6: { 1: "The Fall of Jericho" },
    24: { 1: "The Covenant at Shechem", 14: "Choose Whom You Will Serve" },
  },

  // Judges (7)
  7: {
    6: { 11: "Gideon's Call" },
    16: { 4: "Samson and Delilah" },
  },

  // Ruth (8)
  8: {
    1: { 1: "Naomi Returns from Moab", 15: "Ruth's Loyalty" },
    2: { 1: "Ruth Meets Boaz" },
    4: { 1: "Boaz Marries Ruth" },
  },

  // 1 Samuel (9)
  9: {
    1: { 1: "The Birth of Samuel" },
    3: { 1: "The Lord Calls Samuel" },
    16: { 1: "David Anointed King" },
    17: { 1: "David and Goliath" },
  },

  // 2 Samuel (10)
  10: {
    7: { 1: "God's Promise to David" },
    11: { 1: "David and Bathsheba" },
    12: { 1: "Nathan Rebukes David" },
  },

  // 1 Kings (11)
  11: {
    3: { 1: "Solomon Asks for Wisdom" },
    6: { 1: "Building the Temple" },
    18: { 1: "Elijah and the Prophets of Baal" },
    19: { 1: "Elijah's Flight to Horeb" },
  },

  // 2 Kings (12)
  12: {
    2: { 1: "Elijah Taken Up to Heaven" },
    5: { 1: "Naaman Cleansed of Leprosy" },
  },

  // Esther (17)
  17: {
    4: { 1: "Mordecai Persuades Esther" },
    8: { 1: "The King's New Edict" },
  },

  // Job (18)
  18: {
    1: { 1: "Job's Prosperity", 6: "Job Tested", 13: "Job's Suffering" },
    3: { 1: "Job Curses the Day of His Birth" },
    38: { 1: "The Lord Speaks from the Storm" },
    42: { 1: "Job Humbled and Restored" },
  },

  // Psalms (19)
  19: {
    1: { 1: "The Two Ways" },
    2: { 1: "The Lord's Anointed King" },
    8: { 1: "The Majesty of God" },
    19: { 1: "The Heavens Declare God's Glory" },
    22: { 1: "My God, My God, Why Have You Forsaken Me?" },
    23: { 1: "The Lord Is My Shepherd" },
    24: { 1: "The King of Glory" },
    27: { 1: "The Lord Is My Light and Salvation" },
    32: { 1: "Blessed Is the One Whose Sin Is Forgiven" },
    34: { 1: "I Will Bless the Lord at All Times" },
    37: { 1: "Do Not Fret Because of Evildoers" },
    46: { 1: "God Is Our Refuge and Strength" },
    51: { 1: "Create in Me a Clean Heart, O God" },
    90: { 1: "A Prayer of Moses" },
    91: { 1: "He Who Dwells in the Shelter of the Most High" },
    103: { 1: "Bless the Lord, O My Soul" },
    104: { 1: "O Lord My God, You Are Very Great" },
    107: { 1: "Oh Give Thanks to the Lord" },
    119: {
      1: "Aleph — Walking in God's Law", 9: "Beth — Keeping the Heart Pure",
      17: "Gimel — The Servant's Prayer", 25: "Daleth — Revive Me",
      33: "He — Teach Me Your Statutes", 41: "Waw — Let Your Steadfast Love Come",
      49: "Zayin — Your Word Is My Hope", 57: "Heth — The Lord Is My Portion",
      65: "Teth — You Have Dealt Well", 73: "Yodh — Your Hands Have Made Me",
      81: "Kaph — My Soul Longs for You", 89: "Lamedh — Your Word Is Forever",
      97: "Mem — Oh How I Love Your Law", 105: "Nun — Your Word Is a Lamp",
      113: "Samekh — I Hate Double-Minded Men", 121: "Ayin — I Cry with My Whole Heart",
      129: "Pe — Many Have Afflicted Me", 137: "Tsadhe — Righteous Are You",
      145: "Qoph — I Call with My Whole Heart", 153: "Resh — Look on My Affliction",
      161: "Shin — Princes Persecute Me", 169: "Taw — Let My Cry Come Before You",
    },
    121: { 1: "I Lift Up My Eyes to the Hills" },
    139: { 1: "Search Me, O God" },
    150: { 1: "Let Everything Praise the Lord" },
  },

  // Proverbs (20)
  20: {
    1: { 1: "The Purpose of Proverbs", 20: "Warning Against Enticement" },
    3: { 1: "Trust in the Lord with All Your Heart", 13: "The Value of Wisdom" },
    8: { 1: "Wisdom Calls Aloud" },
    9: { 1: "Wisdom's Invitation", 13: "Folly's Invitation" },
    10: { 1: "The Proverbs of Solomon" },
    31: { 10: "An Excellent Wife" },
  },

  // Ecclesiastes (21)
  21: {
    1: { 1: "Vanity of Vanities" },
    3: { 1: "A Time for Everything" },
    12: { 1: "Remember Your Creator in Your Youth", 9: "The Conclusion of the Matter" },
  },

  // Isaiah (23)
  23: {
    6: { 1: "Isaiah's Call and Commission" },
    9: { 1: "The Prince of Peace" },
    11: { 1: "The Branch from Jesse" },
    40: { 1: "Comfort, Comfort My People", 12: "The Incomparable God", 27: "Strength for the Weary" },
    42: { 1: "The Servant of the Lord" },
    52: { 13: "The Suffering Servant" },
    53: { 1: "He Was Despised and Rejected" },
    55: { 1: "Come, Everyone Who Thirsts" },
    61: { 1: "The Spirit of the Lord Is Upon Me" },
  },

  // Jeremiah (24)
  24: {
    1: { 1: "The Call of Jeremiah" },
    29: { 11: "Plans for Welfare and Not for Evil" },
    31: { 31: "The New Covenant" },
  },

  // Ezekiel (26)
  26: {
    37: { 1: "The Valley of Dry Bones", 15: "Two Sticks Made One" },
  },

  // Daniel (27)
  27: {
    1: { 1: "Daniel in Babylon" },
    2: { 1: "Nebuchadnezzar's Dream" },
    3: { 1: "The Fiery Furnace" },
    5: { 1: "The Writing on the Wall" },
    6: { 1: "Daniel in the Lions' Den" },
  },

  // Jonah (32)
  32: {
    1: { 1: "Jonah Flees from God" },
    2: { 1: "Jonah's Prayer" },
    3: { 1: "Nineveh Repents" },
    4: { 1: "Jonah's Anger and God's Mercy" },
  },

  // Micah (33)
  33: {
    5: { 2: "The Ruler from Bethlehem" },
    6: { 6: "What Does the Lord Require?" },
  },

  // Matthew (40)
  40: {
    1: { 1: "The Genealogy of Jesus Christ", 18: "The Birth of Jesus" },
    2: { 1: "The Visit of the Wise Men", 13: "The Flight to Egypt", 16: "The Massacre of the Infants", 19: "The Return to Nazareth" },
    3: { 1: "John the Baptist Prepares the Way", 13: "The Baptism of Jesus" },
    4: { 1: "The Temptation of Jesus", 12: "Jesus Begins His Ministry", 18: "Jesus Calls the First Disciples", 23: "Jesus Heals the Sick" },
    5: { 1: "The Sermon on the Mount", 3: "The Beatitudes", 13: "Salt and Light", 17: "Christ Came to Fulfil the Law", 21: "Anger", 27: "Adultery", 31: "Divorce", 33: "Oaths", 38: "Eye for Eye", 43: "Love Your Enemies" },
    6: { 1: "Giving to the Needy", 5: "The Lord's Prayer", 16: "Fasting", 19: "Treasure in Heaven", 25: "Do Not Worry" },
    7: { 1: "Judge Not", 7: "Ask, Seek, Knock", 13: "The Narrow Gate", 15: "A Tree and Its Fruit", 24: "The Wise and Foolish Builders" },
    8: { 1: "A Leper Cleansed", 5: "A Centurion's Faith", 14: "Peter's Mother-in-Law Healed", 18: "The Cost of Following Jesus", 23: "Jesus Calms the Storm", 28: "Demons Cast into Pigs" },
    9: { 1: "Jesus Heals a Paralytic", 9: "Matthew Called", 14: "A Question About Fasting", 18: "Jairus's Daughter and a Sick Woman", 27: "Two Blind Men Healed", 35: "The Harvest Is Plentiful" },
    10: { 1: "The Twelve Disciples Sent Out", 16: "Persecution", 24: "Fear God Alone", 34: "Not Peace but a Sword", 40: "Receiving a Prophet" },
    11: { 1: "Messengers from John the Baptist", 7: "Jesus Speaks About John", 20: "Woes on Unrepentant Cities", 25: "Come to Me, All Who Are Weary" },
    12: { 1: "Lord of the Sabbath", 9: "A Man with a Withered Hand", 22: "A House Divided", 38: "The Sign of Jonah", 46: "Jesus' True Family" },
    13: { 1: "The Parable of the Sower", 24: "The Parable of the Weeds", 31: "Mustard Seed and Yeast", 44: "Hidden Treasure and Pearl", 47: "The Net", 53: "A Prophet Without Honour" },
    14: { 1: "The Death of John the Baptist", 13: "Jesus Feeds Five Thousand", 22: "Jesus Walks on Water" },
    15: { 1: "Tradition and Commandment", 21: "A Canaanite Woman's Faith", 29: "Jesus Feeds Four Thousand" },
    16: { 1: "The Demand for a Sign", 5: "The Leaven of the Pharisees", 13: "Peter's Confession", 21: "Jesus Foretells His Death", 24: "Take Up Your Cross" },
    17: { 1: "The Transfiguration", 14: "A Boy with a Demon", 22: "Jesus Foretells His Death Again", 24: "The Temple Tax" },
    18: { 1: "Who Is the Greatest?", 10: "The Lost Sheep", 15: "Dealing with Sin", 21: "Forgiving a Brother" },
    19: { 1: "Teaching on Divorce", 13: "Let the Children Come", 16: "The Rich Young Man", 23: "The Danger of Wealth" },
    20: { 1: "Workers in the Vineyard", 17: "Jesus Foretells His Death a Third Time", 20: "A Mother's Request", 29: "Two Blind Men" },
    21: { 1: "The Triumphal Entry", 12: "Jesus Cleanses the Temple", 18: "The Fig Tree Withered", 23: "By What Authority?", 28: "The Two Sons", 33: "The Tenants" },
    22: { 1: "The Wedding Feast", 15: "Render to Caesar", 23: "The Resurrection", 34: "The Great Commandment", 41: "Whose Son Is the Christ?" },
    23: { 1: "Beware of the Scribes and Pharisees", 13: "Seven Woes", 37: "Lament over Jerusalem" },
    24: { 1: "The Destruction of the Temple Foretold", 15: "The Abomination of Desolation", 29: "The Coming of the Son of Man", 36: "No One Knows the Hour", 45: "The Faithful Servant" },
    25: { 1: "The Ten Virgins", 14: "The Talents", 31: "The Sheep and the Goats" },
    26: { 1: "The Plot Against Jesus", 6: "Anointed at Bethany", 14: "Judas Betrays Jesus", 17: "The Last Supper", 36: "Gethsemane", 47: "Jesus Arrested", 57: "Jesus Before the High Priest", 69: "Peter Denies Jesus" },
    27: { 1: "Jesus Delivered to Pilate", 11: "Pilate Questions Jesus", 27: "The Soldiers Mock Jesus", 32: "The Crucifixion", 45: "The Death of Jesus", 57: "The Burial", 62: "The Guard at the Tomb" },
    28: { 1: "The Resurrection", 11: "The Report of the Guard", 16: "The Great Commission" },
  },

  // Mark (41)
  41: {
    1: { 1: "The Beginning of the Gospel", 9: "The Baptism and Temptation of Jesus", 14: "Jesus Calls the First Disciples", 21: "Jesus Drives Out an Evil Spirit", 29: "Jesus Heals Many", 35: "Jesus Preaches in Galilee", 40: "Jesus Cleanses a Leper" },
    2: { 1: "Jesus Heals a Paralytic", 13: "Levi Called", 18: "A Question About Fasting", 23: "Lord of the Sabbath" },
    3: { 1: "A Withered Hand Restored", 7: "Crowds Follow Jesus", 13: "The Twelve Appointed", 20: "A House Divided", 31: "Jesus' True Family" },
    4: { 1: "The Parable of the Sower", 21: "A Lamp Under a Basket", 26: "The Seed Growing", 30: "The Mustard Seed", 35: "Jesus Calms the Storm" },
    5: { 1: "The Gerasene Demoniac", 21: "Jairus's Daughter and a Sick Woman" },
    6: { 1: "A Prophet Without Honour", 6: "The Twelve Sent Out", 14: "The Death of John the Baptist", 30: "Jesus Feeds Five Thousand", 45: "Jesus Walks on Water" },
    8: { 1: "Jesus Feeds Four Thousand", 27: "Peter's Confession", 31: "Jesus Foretells His Death" },
    9: { 1: "The Transfiguration", 14: "A Boy with an Unclean Spirit", 30: "Jesus Foretells His Death Again", 33: "Who Is the Greatest?" },
    10: { 1: "Teaching on Divorce", 13: "Let the Children Come", 17: "The Rich Young Man", 32: "Jesus Foretells His Death a Third Time", 46: "Blind Bartimaeus" },
    11: { 1: "The Triumphal Entry", 12: "The Fig Tree and the Temple", 27: "The Authority of Jesus" },
    12: { 1: "The Tenants", 13: "Render to Caesar", 18: "The Resurrection", 28: "The Great Commandment", 38: "Scribes Condemned", 41: "The Widow's Offering" },
    13: { 1: "The Destruction Foretold", 14: "The Abomination", 24: "The Son of Man Coming", 32: "No One Knows the Day" },
    14: { 1: "The Plot Against Jesus", 3: "Anointed at Bethany", 10: "Judas Betrays", 12: "The Last Supper", 26: "The Mount of Olives", 32: "Gethsemane", 43: "Jesus Arrested", 53: "Before the Council", 66: "Peter Denies Jesus" },
    15: { 1: "Jesus Before Pilate", 16: "The Soldiers Mock Jesus", 21: "The Crucifixion", 33: "The Death of Jesus", 42: "The Burial" },
    16: { 1: "The Resurrection", 14: "The Great Commission" },
  },

  // Luke (42)
  42: {
    1: { 1: "Dedication to Theophilus", 5: "The Birth of John Foretold", 26: "The Birth of Jesus Foretold", 39: "Mary Visits Elizabeth", 46: "The Magnificat", 57: "The Birth of John the Baptist", 67: "The Song of Zechariah" },
    2: { 1: "The Birth of Jesus", 8: "The Shepherds and Angels", 21: "Jesus Presented at the Temple", 39: "The Return to Nazareth", 41: "The Boy Jesus in the Temple" },
    3: { 1: "John the Baptist's Ministry", 21: "The Baptism of Jesus", 23: "The Genealogy of Jesus" },
    4: { 1: "The Temptation of Jesus", 14: "Jesus Rejected at Nazareth", 31: "Jesus Drives Out a Demon", 38: "Jesus Heals Many" },
    5: { 1: "The First Disciples Called", 12: "A Leper Cleansed", 17: "Jesus Heals a Paralytic", 27: "Levi Called" },
    6: { 1: "Lord of the Sabbath", 6: "A Withered Hand Restored", 12: "The Twelve Apostles", 17: "Blessings and Woes", 27: "Love Your Enemies", 37: "Judge Not", 43: "A Tree and Its Fruit", 46: "Build on the Rock" },
    7: { 1: "A Centurion's Faith", 11: "A Widow's Son Raised", 18: "John's Messengers", 36: "A Sinful Woman Forgiven" },
    8: { 1: "Women Who Followed Jesus", 4: "The Parable of the Sower", 22: "Jesus Calms the Storm", 26: "The Gerasene Demoniac", 40: "Jairus and a Sick Woman" },
    9: { 1: "The Twelve Sent Out", 10: "Jesus Feeds Five Thousand", 18: "Peter's Confession", 28: "The Transfiguration", 37: "A Boy with a Demon", 51: "Jesus Heads to Jerusalem", 57: "The Cost of Following Jesus" },
    10: { 1: "The Seventy-Two Sent Out", 17: "The Return of the Seventy-Two", 25: "The Good Samaritan", 38: "Mary and Martha" },
    11: { 1: "The Lord's Prayer", 5: "Ask, Seek, Knock", 14: "Jesus and Beelzebul", 29: "The Sign of Jonah" },
    12: { 1: "Fear God, Not Man", 13: "The Rich Fool", 22: "Do Not Be Anxious", 35: "Be Watchful" },
    13: { 1: "Repent or Perish", 10: "A Crippled Woman Healed on the Sabbath", 18: "Mustard Seed and Yeast", 22: "The Narrow Door" },
    14: { 1: "A Man with Dropsy Healed", 7: "Humility at the Table", 15: "The Great Banquet", 25: "Counting the Cost" },
    15: { 1: "The Lost Sheep", 8: "The Lost Coin", 11: "The Prodigal Son" },
    16: { 1: "The Shrewd Manager", 19: "The Rich Man and Lazarus" },
    17: { 11: "Ten Lepers Healed", 20: "The Coming of the Kingdom" },
    18: { 1: "The Persistent Widow", 9: "The Pharisee and the Tax Collector", 15: "Let the Children Come", 18: "The Rich Ruler", 31: "Jesus Foretells His Death", 35: "A Blind Beggar" },
    19: { 1: "Zacchaeus the Tax Collector", 11: "The Ten Minas", 28: "The Triumphal Entry", 45: "Jesus Cleanses the Temple" },
    20: { 1: "By What Authority?", 9: "The Tenants", 20: "Render to Caesar", 27: "The Resurrection", 45: "Beware of the Scribes" },
    21: { 1: "The Widow's Offering", 5: "Signs of the End", 20: "Jerusalem Surrounded", 25: "The Son of Man Coming", 34: "Watch Yourselves" },
    22: { 1: "Judas's Agreement", 7: "The Last Supper", 21: "Who Is the Greatest?", 39: "Jesus Prays on the Mount of Olives", 47: "Jesus Arrested", 54: "Peter Denies Jesus", 63: "Jesus Mocked and Tried" },
    23: { 1: "Jesus Before Pilate", 26: "The Crucifixion", 44: "The Death of Jesus", 50: "The Burial" },
    24: { 1: "The Resurrection", 13: "The Road to Emmaus", 36: "Jesus Appears to the Disciples", 44: "The Ascension" },
  },

  // John (43)
  43: {
    1: { 1: "The Word Became Flesh", 6: "The Witness of John the Baptist", 19: "John's Testimony Before the Priests", 29: "Behold, the Lamb of God", 35: "The First Disciples of Jesus", 43: "Jesus Calls Philip and Nathanael" },
    2: { 1: "The Wedding at Cana", 12: "Jesus Cleanses the Temple" },
    3: { 1: "Jesus and Nicodemus", 16: "For God So Loved the World", 22: "John the Baptist's Final Witness" },
    4: { 1: "Jesus and the Woman at the Well", 43: "Jesus Heals an Official's Son" },
    5: { 1: "The Healing at the Pool of Bethesda", 16: "The Authority of the Son", 31: "Witnesses to Jesus" },
    6: { 1: "Jesus Feeds Five Thousand", 16: "Jesus Walks on Water", 22: "I Am the Bread of Life", 60: "Many Disciples Turn Back" },
    7: { 1: "Jesus at the Feast of Tabernacles", 37: "Rivers of Living Water" },
    8: { 2: "A Woman Caught in Adultery", 12: "I Am the Light of the World", 31: "The Truth Will Set You Free", 48: "Before Abraham Was, I Am" },
    9: { 1: "A Man Born Blind Healed", 13: "The Pharisees Investigate", 35: "Spiritual Blindness" },
    10: { 1: "The Good Shepherd", 22: "Jesus at the Feast of Dedication" },
    11: { 1: "The Death of Lazarus", 17: "I Am the Resurrection and the Life", 38: "Lazarus Raised", 45: "The Plot to Kill Jesus" },
    12: { 1: "Mary Anoints Jesus", 9: "The Triumphal Entry", 20: "Jesus Foretells His Death", 37: "Unbelief Among the People" },
    13: { 1: "Jesus Washes the Disciples' Feet", 18: "Jesus Foretells His Betrayal", 31: "A New Commandment", 36: "Peter's Denial Foretold" },
    14: { 1: "I Am the Way, the Truth, and the Life", 15: "The Promise of the Holy Spirit", 25: "Peace I Leave with You" },
    15: { 1: "I Am the True Vine", 18: "The World's Hatred" },
    16: { 1: "The Work of the Holy Spirit", 16: "Your Sorrow Will Turn to Joy", 25: "I Have Overcome the World" },
    17: { 1: "Jesus Prays for Himself", 6: "Jesus Prays for the Disciples", 20: "Jesus Prays for All Believers" },
    18: { 1: "Jesus Betrayed and Arrested", 12: "Jesus Before Annas", 15: "Peter Denies Jesus", 19: "The High Priest Questions Jesus", 28: "Jesus Before Pilate" },
    19: { 1: "Jesus Condemned and Crucified", 16: "The Crucifixion", 25: "Jesus' Mother and the Beloved Disciple", 28: "The Death of Jesus", 38: "The Burial of Jesus" },
    20: { 1: "The Empty Tomb", 11: "Jesus Appears to Mary Magdalene", 19: "Jesus Appears to the Disciples", 24: "Jesus and Thomas", 30: "The Purpose of This Book" },
    21: { 1: "Jesus Appears by the Sea", 15: "Peter Restored", 20: "The Beloved Disciple" },
  },

  // Acts (44)
  44: {
    1: { 1: "The Promise of the Spirit", 6: "The Ascension", 12: "Matthias Chosen" },
    2: { 1: "The Day of Pentecost", 14: "Peter's Sermon", 37: "Three Thousand Baptised", 42: "The Fellowship of Believers" },
    3: { 1: "Peter Heals a Lame Man", 11: "Peter Speaks in Solomon's Porch" },
    4: { 1: "Peter and John Arrested", 23: "Prayer for Boldness", 32: "Believers Share Everything" },
    5: { 1: "Ananias and Sapphira", 12: "Signs and Wonders", 17: "The Apostles Persecuted", 29: "We Must Obey God" },
    6: { 1: "The Seven Chosen", 8: "Stephen Arrested" },
    7: { 1: "Stephen's Defence", 54: "The Stoning of Stephen" },
    8: { 1: "The Church Scattered", 4: "Philip in Samaria", 26: "Philip and the Ethiopian" },
    9: { 1: "The Conversion of Saul", 10: "Ananias and Saul", 26: "Saul in Jerusalem" },
    10: { 1: "Cornelius's Vision", 9: "Peter's Vision", 34: "The Gentiles Receive the Spirit" },
    13: { 1: "Barnabas and Saul Set Apart", 13: "Paul's Sermon in Antioch" },
    15: { 1: "The Jerusalem Council" },
    16: { 6: "The Macedonian Call", 11: "In Philippi", 16: "Paul and Silas in Prison" },
    17: { 1: "In Thessalonica", 10: "In Berea", 16: "Paul in Athens" },
    18: { 1: "Paul in Corinth", 24: "Apollos" },
    19: { 1: "Paul in Ephesus", 21: "The Riot in Ephesus" },
    20: { 17: "Paul's Farewell to the Ephesian Elders" },
    27: { 1: "Paul Sails for Rome", 14: "The Storm" },
    28: { 1: "On Malta", 11: "Paul Arrives in Rome", 17: "Paul Preaches in Rome" },
  },

  // Romans (45)
  45: {
    1: { 1: "The Gospel of God", 16: "The Righteous Shall Live by Faith", 18: "God's Wrath on Unrighteousness" },
    2: { 1: "God's Righteous Judgment" },
    3: { 9: "None Is Righteous", 21: "Righteousness Through Faith" },
    4: { 1: "Abraham Justified by Faith" },
    5: { 1: "Peace with God Through Faith", 12: "Death Through Adam, Life Through Christ" },
    6: { 1: "Dead to Sin, Alive to God", 15: "Slaves to Righteousness" },
    7: { 1: "Released from the Law", 14: "The Inner Conflict" },
    8: { 1: "Life in the Spirit", 14: "Children of God", 18: "Future Glory", 26: "The Spirit Intercedes", 31: "More Than Conquerors" },
    9: { 1: "God's Sovereign Election", 30: "Israel's Unbelief" },
    10: { 1: "Righteousness by Faith" },
    11: { 1: "The Remnant", 11: "Gentiles Grafted In", 33: "Doxology" },
    12: { 1: "A Living Sacrifice", 9: "Love in Action" },
    13: { 1: "Governing Authorities", 8: "Love Fulfils the Law", 11: "The Day Is Near" },
    14: { 1: "Do Not Pass Judgment" },
    15: { 1: "Bear with the Weak", 14: "Paul's Ministry" },
    16: { 1: "Personal Greetings", 25: "Closing Doxology" },
  },

  // 1 Corinthians (46)
  46: {
    1: { 1: "Paul's Greeting", 10: "Divisions in the Church", 18: "Christ the Wisdom and Power of God" },
    2: { 1: "Wisdom from the Spirit" },
    3: { 1: "Spiritual Immaturity", 10: "God's Fellow Workers" },
    5: { 1: "Sexual Immorality in the Church" },
    6: { 9: "Glorify God in Your Body" },
    7: { 1: "Instructions on Marriage" },
    9: { 1: "Paul's Rights as an Apostle", 19: "All Things to All People" },
    10: { 1: "Warning from Israel's History", 14: "Flee from Idolatry" },
    11: { 17: "The Lord's Supper" },
    12: { 1: "Spiritual Gifts", 12: "One Body, Many Members" },
    13: { 1: "The Way of Love" },
    14: { 1: "Tongues and Prophecy" },
    15: { 1: "The Resurrection of Christ", 12: "The Resurrection of the Dead", 35: "The Resurrection Body", 51: "Victory over Death" },
    16: { 1: "The Collection for the Saints", 19: "Final Greetings" },
  },

  // 2 Corinthians (47)
  47: {
    1: { 1: "God of All Comfort", 12: "Paul's Change of Plans" },
    3: { 1: "Ministers of the New Covenant" },
    4: { 1: "Treasure in Jars of Clay", 13: "An Eternal Weight of Glory" },
    5: { 1: "Our Heavenly Dwelling", 11: "The Ministry of Reconciliation", 17: "If Anyone Is in Christ" },
    8: { 1: "Generous Giving" },
    12: { 1: "Paul's Thorn in the Flesh" },
  },

  // Galatians (48)
  48: {
    1: { 1: "No Other Gospel", 11: "Paul Called by God" },
    2: { 1: "Paul and the Apostles", 11: "Opposing Peter", 15: "Justified by Faith" },
    3: { 1: "Faith or Works of the Law?", 15: "The Law and the Promise", 23: "Sons of God" },
    4: { 1: "Heirs, Not Slaves" },
    5: { 1: "Called to Freedom", 13: "Walk by the Spirit", 19: "The Fruit of the Spirit" },
    6: { 1: "Bear One Another's Burdens" },
  },

  // Ephesians (49)
  49: {
    1: { 1: "Blessed in Christ", 15: "Prayer for Wisdom" },
    2: { 1: "Made Alive Together with Christ", 11: "One in Christ" },
    3: { 1: "The Mystery of the Gospel", 14: "Prayer for Strength" },
    4: { 1: "Unity in the Body", 17: "The New Life" },
    5: { 1: "Walk in Love", 15: "Walk Carefully", 22: "Wives and Husbands" },
    6: { 1: "Children and Parents", 5: "Bondservants and Masters", 10: "The Armour of God" },
  },

  // Philippians (50)
  50: {
    1: { 1: "Paul's Greeting", 12: "Paul's Imprisonment Advances the Gospel", 27: "Living Worthy of the Gospel" },
    2: { 1: "Have the Mind of Christ", 12: "Shining as Lights", 19: "Timothy and Epaphroditus" },
    3: { 1: "No Confidence in the Flesh", 10: "Pressing Toward the Goal", 17: "Our Citizenship in Heaven" },
    4: { 1: "Rejoice in the Lord Always", 4: "The Peace of God", 10: "I Have Learned Contentment" },
  },

  // Colossians (51)
  51: {
    1: { 1: "Paul's Greeting and Thanksgiving", 15: "The Supremacy of Christ", 24: "Paul's Labour for the Church" },
    2: { 6: "Walk in Christ", 16: "Freedom from Human Rules" },
    3: { 1: "Set Your Mind on Things Above", 18: "Rules for Christian Households" },
    4: { 1: "Further Instructions", 7: "Final Greetings" },
  },

  // 1 Thessalonians (52)
  52: {
    4: { 1: "Walk to Please God", 13: "The Coming of the Lord" },
    5: { 1: "The Day of the Lord", 12: "Final Instructions" },
  },

  // 2 Thessalonians (53)
  53: {
    2: { 1: "The Man of Lawlessness", 13: "Stand Firm" },
    3: { 6: "Warning Against Idleness" },
  },

  // 1 Timothy (54)
  54: {
    1: { 1: "Paul's Greeting", 3: "Warning Against False Doctrine", 12: "Trustworthy: Christ Came to Save Sinners" },
    2: { 1: "Pray for All People", 8: "Instructions for Men and Women" },
    3: { 1: "Qualifications for Overseers", 8: "Qualifications for Deacons" },
    6: { 6: "Godliness with Contentment", 17: "Instructions for the Wealthy" },
  },

  // 2 Timothy (55)
  55: {
    1: { 1: "Paul's Greeting", 6: "Guard the Good Deposit" },
    2: { 1: "A Good Soldier of Christ Jesus", 14: "An Approved Worker" },
    3: { 1: "Godlessness in the Last Days", 10: "Continue in What You Have Learned" },
    4: { 1: "Preach the Word" },
  },

  // Titus (56)
  56: {
    2: { 1: "Teach Sound Doctrine", 11: "The Grace of God Has Appeared" },
    3: { 1: "Doing Good", 9: "Final Instructions" },
  },

  // Philemon (57)
  57: {
    1: { 1: "Paul's Greeting", 8: "Paul's Plea for Onesimus" },
  },

  // Hebrews (58)
  58: {
    1: { 1: "God Has Spoken by His Son", 5: "The Son Superior to Angels" },
    2: { 1: "A Great Salvation", 5: "The Pioneer of Salvation" },
    3: { 1: "Jesus Greater Than Moses", 7: "A Sabbath Rest Awaits" },
    4: { 1: "Entering God's Rest", 14: "Jesus Our Great High Priest" },
    5: { 1: "Every High Priest", 11: "Warning: Do Not Fall Away" },
    6: { 13: "The Certainty of God's Promise" },
    7: { 1: "The Priesthood of Melchizedek", 20: "A Better Covenant" },
    9: { 1: "The Earthly Sanctuary", 11: "The Blood of Christ" },
    10: { 1: "Christ's Sacrifice Once for All", 19: "A Call to Hold Fast", 26: "Warning Against Deliberate Sin" },
    11: { 1: "By Faith", 8: "By Faith Abraham", 32: "Time Would Fail Me to Tell" },
    12: { 1: "Run the Race with Endurance", 14: "A Kingdom That Cannot Be Shaken" },
    13: { 1: "Brotherly Love and Good Deeds", 15: "Sacrifice of Praise" },
  },

  // James (59)
  59: {
    1: { 1: "Trials and Wisdom", 13: "Temptation", 19: "Be Doers of the Word" },
    2: { 1: "The Sin of Partiality", 14: "Faith Without Works Is Dead" },
    3: { 1: "Taming the Tongue", 13: "Wisdom from Above" },
    4: { 1: "Warning Against Pride" },
    5: { 1: "Warning to the Rich", 7: "Be Patient", 13: "The Prayer of Faith" },
  },

  // 1 Peter (60)
  60: {
    1: { 1: "Born Again to a Living Hope", 13: "Be Holy", 22: "Love One Another Earnestly" },
    2: { 1: "A Living Stone and a Holy Nation", 13: "Honourable Conduct Among the Gentiles" },
    3: { 1: "Wives and Husbands", 8: "Harmony and Suffering for Righteousness" },
    4: { 1: "Arm Yourselves with Christ's Attitude", 12: "Sharing in Christ's Sufferings" },
    5: { 1: "Shepherd the Flock", 6: "Humble Yourselves" },
  },

  // 2 Peter (61)
  61: {
    1: { 1: "Confirm Your Calling", 12: "The Word of the Prophets" },
    2: { 1: "False Prophets and False Teachers" },
    3: { 1: "The Day of the Lord Will Come", 14: "Final Words" },
  },

  // 1 John (62)
  62: {
    1: { 1: "The Word of Life", 5: "God Is Light" },
    2: { 1: "Christ Our Advocate", 12: "Do Not Love the World", 18: "The Antichrist", 24: "Abide in What You Heard" },
    3: { 1: "Children of God", 11: "Love One Another" },
    4: { 1: "Test the Spirits", 7: "God Is Love" },
    5: { 1: "Faith That Overcomes the World", 13: "That You May Know You Have Eternal Life" },
  },

  // 2 John (63)
  63: {
    1: { 1: "Walk in Truth and Love", 7: "Warning Against Deceivers" },
  },

  // 3 John (64)
  64: {
    1: { 1: "Gaius Commended", 9: "Diotrephes and Demetrius" },
  },

  // Jude (65)
  65: {
    1: { 1: "Contend for the Faith", 17: "Persevere in God's Love", 24: "Doxology" },
  },

  // Revelation (66)
  66: {
    1: { 1: "Prologue", 9: "The Vision of the Son of Man" },
    2: { 1: "To the Church in Ephesus", 8: "To the Church in Smyrna", 12: "To the Church in Pergamum", 18: "To the Church in Thyatira" },
    3: { 1: "To the Church in Sardis", 7: "To the Church in Philadelphia", 14: "To the Church in Laodicea" },
    4: { 1: "The Throne in Heaven" },
    5: { 1: "The Scroll and the Lamb" },
    6: { 1: "The Seven Seals Opened" },
    7: { 1: "The 144,000 Sealed", 9: "The Great Multitude" },
    8: { 1: "The Seventh Seal and the Golden Censer" },
    11: { 15: "The Seventh Trumpet" },
    12: { 1: "The Woman and the Dragon" },
    13: { 1: "The Beast from the Sea", 11: "The Beast from the Earth" },
    14: { 1: "The 144,000 with the Lamb", 6: "The Three Angels" },
    17: { 1: "The Great Prostitute" },
    18: { 1: "The Fall of Babylon" },
    19: { 1: "Hallelujah!", 11: "The Rider on the White Horse" },
    20: { 1: "The Thousand Years", 7: "Satan Released", 11: "The Great White Throne" },
    21: { 1: "The New Heaven and Earth", 9: "The New Jerusalem" },
    22: { 1: "The River of Life", 6: "Jesus Is Coming Soon", 17: "Come!" },
  },
};

export function getSectionHeading(book: number, chapter: number, verse: number): string | null {
  return SECTION_HEADINGS[book]?.[chapter]?.[verse] ?? null;
}

/** True when a verse begins a new paragraph (¶ character from Bolls.life). */
export function isParagraphStart(text: string): boolean {
  return text.includes("¶");
}

/** Strip the ¶ paragraph mark from display text. */
export function stripParagraphMark(text: string): string {
  return text.replace(/¶\s*/g, "").trim();
}
