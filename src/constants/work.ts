import aiForMessaging from "../assets/work-tab/personal/ai-for-messaging.webp";
import anonimo from "../assets/work-tab/personal/anonimo.webp";
import boldBot from "../assets/work-tab/personal/bold-bot.webp";
import boldStore from "../assets/work-tab/personal/bold.webp";
import infinite from "../assets/work-tab/personal/infinite-rider.webp";

import airbnb from "../assets/work-tab/youtube/airbnb.webp";
import calc from "../assets/work-tab/youtube/calc.webp";
import crypto from "../assets/work-tab/youtube/crypto.jpg";
import finance from "../assets/work-tab/youtube/finance.webp";
import flappy from "../assets/work-tab/youtube/flappy.webp";
import git from "../assets/work-tab/youtube/git.webp";
import insta from "../assets/work-tab/youtube/insta.webp";
import mario from "../assets/work-tab/youtube/mario.webp";
import pacman from "../assets/work-tab/youtube/pacman.webp";
import podcast from "../assets/work-tab/youtube/podcast.jpg";
import portfolio from "../assets/work-tab/youtube/portfolio.jpg";
import quiz from "../assets/work-tab/youtube/quiz.webp";
import react from "../assets/work-tab/youtube/react.webp";
import snake from "../assets/work-tab/youtube/snake.webp";
import spotify from "../assets/work-tab/youtube/spotify.webp";
import tictac from "../assets/work-tab/youtube/tictac.webp";
import twitter from "../assets/work-tab/youtube/twitter.webp";

import things18 from "../assets/work-tab/books/18-things.webp";
import lockdownWars from "../assets/work-tab/books/lockdown-wars.webp";

export const work = [
  [
    {
      cardData: {
        title: "AI For Messaging App",
        url: {
          githubUrl: "https://github.com/orgs/whatsapp-ai-helper/repositories",
        },
        imgUrl: aiForMessaging,
      },
      modalData: {
        title: "AI For Messaging App",
        desc: "Transform your thoughts into effective messages using the power of Al. No Signup Required. Express Your thoughts via Chat or Voice. Use Quick chips to instantly write messages.",
        infoHeading: "Technologies Used",
        infoArr: [
          "React Native",
          "Flask",
          "Javascript",
          "Python",
          "Open AI API",
        ],
      },
    },
    {
      cardData: {
        title: "BOLDBot",
        imgUrl: boldBot,
        url: {
          githubUrl: "https://github.com/BoldStore/bold-bot-frontend",
        },
      },
      modalData: {
        title: "BOLDBot.",
        desc: "BOLDbot is the next step in automating customer service for Instagram businesses. It levels up the professionalism of your business by increasing efficacy and simplifying interaction with your consumer.",
        infoHeading: "Technologies Used",
        infoArr: [
          "Next JS",
          "Typescript",
          "Nest JS",
          "Redux",
          "Firebase",
          "Framer Motion",
        ],
      },
    },
    {
      cardData: {
        title: "BOLD Store",
        imgUrl: boldStore,
        url: {
          githubUrl: "https://github.com/BoldStore/MobileApp",
        },
      },
      modalData: {
        title: "BOLD Store",
        desc: "BOLD Store is the world's first one click market place. Fully integrated with Facebook APIs, automatically converts your feed into a store ",
        infoHeading: "Technologies Used",
        infoArr: [
          "React Native",
          "Expo",
          "Firebase",
          "Javascript",
          "Redux",
          "Node JS",
        ],
      },
    },
    {
      cardData: {
        title: "Infinite Rider & Infinite Rider 3D",
        url: null,
        imgUrl: infinite,
      },
      modalData: {
        title: "Infinite Rider & Infinite Rider 3D",
        desc: "Infinite Rider is a 2D and 3D game is a flappy bird kind infinite game where the player has to avoid obstacles",
        infoHeading: "Technologies Used",
        infoArr: ["Unity", "C#"],
      },
    },
    {
      cardData: {
        title: "Anonimo.fun",
        url: {
          githubUrl: "",
        },
        imgUrl: anonimo,
      },
      modalData: {
        title: "Anonimo.fun",
        desc: "Anonimo is a social media app that allows users to chat anonymously. It is a platform where users can share their thoughts and opinions without the fear of being judged.",
        infoHeading: "Technologies Used",
        infoArr: ["Next JS", "Firebase", "Javascript", "MUI"],
      },
    },
  ],
  [
    {
      cardData: {
        title: "Crypto Currency Price Tracker",
        imgUrl: crypto,
        url: {
          youtubeUrl: "https://youtu.be/MIhQZxboUBA?feature=shared",
        },
      },
      modalData: {
        title: "Crypto Currency Price Tracker",
        desc: "Track crypto currencies through Coin gecko api in real time. Visit the dashboard to do so!",
        infoHeading: "Technologies Used",
        infoArr: ["React JS", "JavaScript", "MUI", "Chart JS", "Framer Motion"],
      },
    },
    {
      cardData: {
        title: "Podcast Platform Like Spotify",
        imgUrl: podcast,
        url: {
          youtubeUrl: "https://youtu.be/a5Q4ngpSJnA?feature=shared",
        },
      },
      modalData: {
        title: "Podcast Platform Like Spotify",
        desc: "A podcast platform like Spotify where you can listen to your favorite podcasts. You can also create your own podcasts and upload them.",
        infoHeading: "Technologies Used",
        infoArr: ["React JS", "JavaScript", "MUI", "Firebase", "Redux"],
      },
    },
    {
      cardData: {
        title: "Personal Finance Tracker",
        imgUrl: finance,
        url: {
          youtubeUrl: "https://youtu.be/iQBJspbKp0s?feature=shared",
        },
      },
      modalData: {
        title: "Personal Finance Tracker",
        desc: "A personal finance tracker where you can track your income and expenses. You can also set a budget and see how much you have spent.",
        infoHeading: "Technologies Used",
        infoArr: ["React JS", "JavaScript", "Ant Design", "Firebase", "Redux"],
      },
    },
    {
      cardData: {
        title: "Tic Tac Toe Using JavaScript",
        imgUrl: tictac,
        url: {
          youtubeUrl: "https://www.youtube.com/live/ZtnQlqJE-Wo?feature=shared",
        },
      },
      modalData: {
        title: "Tic Tac Toe Using JavaScript",
        desc: "A tic tac toe game made using JavaScript. You can play with your friends or with the computer.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Pacman Using JavaScript",
        imgUrl: pacman,
        url: {
          youtubeUrl: "https://www.youtube.com/live/zU2hsb1yxUo?feature=shared",
        },
      },
      modalData: {
        title: "Pacman Using JavaScript",
        desc: "A pacman game made using JavaScript. You can play the game and try to eat all the food without getting caught by the ghosts.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Mario Using JavaScript",
        imgUrl: mario,
        url: {
          youtubeUrl: "https://www.youtube.com/live/ioJbYLyj_W8?feature=shared",
        },
      },
      modalData: {
        title: "Mario Using JavaScript",
        desc: "A mario game made using JavaScript. You can play the game and try to reach the flag without getting caught by the enemies.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Calculator Using JavaScript",
        imgUrl: calc,
        url: {
          youtubeUrl: "https://www.youtube.com/live/otRjzBCYleg?feature=shared",
        },
      },
      modalData: {
        title: "Calculator Using JavaScript",
        desc: "A calculator made using JavaScript. You can perform basic arithmetic operations using this calculator.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Quiz App Using JavaScript",
        imgUrl: quiz,
        url: {
          youtubeUrl: "https://www.youtube.com/live/CtLx3uVTGOs?feature=shared",
        },
      },
      modalData: {
        title: "Quiz App Using JavaScript",
        desc: "A quiz app made using JavaScript. You can play the quiz and test your knowledge.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Snake Game Using JavaScript",
        imgUrl: snake,
        url: {
          youtubeUrl: "https://www.youtube.com/live/_S68uRsynxE?feature=shared",
        },
      },
      modalData: {
        title: "Snake Game Using JavaScript",
        desc: "A snake game made using JavaScript. You can play the game and try to eat the food without hitting the walls or yourself.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Spotify Clone",
        imgUrl: spotify,
        url: {
          youtubeUrl: "https://www.youtube.com/live/vnB2kA3mAgs?feature=shared",
        },
      },
      modalData: {
        title: "Spotify Clone",
        desc: "A spotify clone made using HTML and CSS.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Instagram Clone",
        imgUrl: insta,
        url: {
          youtubeUrl: "https://www.youtube.com/live/vnB2kA3mAgs?feature=shared",
        },
      },
      modalData: {
        title: "Instagram Clone",
        desc: "A Instagram clone made using HTML and CSS.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Learn Git and Github",
        imgUrl: git,
        url: {
          youtubeUrl: "https://www.youtube.com/live/u62rKX8GSfY?feature=shared",
        },
      },
      modalData: {
        title: "Learn Git and Github",
        desc: "A tutorial on how to use Git and Github.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Airbnb Clone with React",
        imgUrl: airbnb,
        url: {
          youtubeUrl: "https://www.youtube.com/live/Z8bpTT8GdNE?feature=shared",
        },
      },
      modalData: {
        title: "Airbnb Clone with React",
        desc: "An Airbnb clone made using React.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Twitter Clone with HTML",
        imgUrl: twitter,
        url: {
          youtubeUrl: "https://www.youtube.com/live/XK9_YxlEmvI?feature=shared",
        },
      },
      modalData: {
        title: "Twitter Clone with HTML",
        desc: "A Twitter clone made using HTML.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Fundamentals Of React",
        imgUrl: react,
        url: {
          youtubeUrl: "https://www.youtube.com/live/ghTS9wPhT10?feature=shared",
        },
      },
      modalData: {
        title: "Fundamentals Of React",
        desc: "A tutorial on the fundamentals of React.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Flappy Birds with JS",
        imgUrl: flappy,
        url: {
          youtubeUrl: "https://www.youtube.com/live/qCNlqjdBhc0?feature=shared",
        },
      },
      modalData: {
        title: "Flappy Birds with JS",
        desc: "A flappy birds game made using JavaScript.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
    {
      cardData: {
        title: "Portfolio in React",
        imgUrl: portfolio,
        url: {
          youtubeUrl: "https://youtu.be/fq3IQUZ_6OM?feature=shared",
        },
      },
      modalData: {
        title: "Portfolio in React",
        desc: "A portfolio website made using React.",
        infoHeading: "Technologies Used",
        infoArr: ["HTML", "CSS", "Javascript"],
      },
    },
  ],
  [
    {
      cardData: {
        title: "Books Published",
        imgUrl: things18,
        url: null,
      },
      modalData: {
        title: "Books I have Published",
        desc: "I have published 18 books on Amazon Kindle. The books are on various topics like programming, self help, and fiction.",
        infoHeading: "Books",
      },
    },

    {
      cardData: {
        title: "Podcast",
        imgUrl: lockdownWars,
        url: null,
      },
      modalData: {
        title: "Lockdown Wars Podcast",
        desc: "I have published 18 books on Amazon Kindle. The books are on various topics like programming, self help, and fiction.",
        infoHeading: "Books",
      },
    },
  ],
];
