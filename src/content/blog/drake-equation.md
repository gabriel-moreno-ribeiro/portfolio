---
title: The Drake equation, with and without history
date: 2026-11-05
description: Seven factors on a blackboard in 1961, an integral that adds time to them, and why they're the same equation.
draft: true
---

When I was 14, $F = ma$ and the Drake equation looked equally impossible to me. Both were a few letters on a board. The difference is that you can roll a cart down a ramp and watch $F = ma$ happen. Nobody has a ramp for alien civilizations.

So this post is my ramp. First the equation as Frank Drake wrote it in 1961, one factor at a time. Then a version with an integral in it, the one I used in my essay, which looks much scarier. Then the part I like most: the scary one contains the simple one. They're the same equation, one with history and one without.

<!-- FOTO 1: sua folha com a equação clássica escrita à mão, de preferência com os fatores circulados. Salve em public/blog/drake-equation/ e troque este comentário por: ![legenda](/blog/drake-equation/01.webp) -->

## A meeting agenda that became famous

In November 1961, Drake organized a small meeting at the National Radio Astronomy Observatory in Green Bank, West Virginia, about one question: is anyone out there to listen to? About ten people came, Carl Sagan among them. Drake needed an agenda, so he wrote on the blackboard the things you'd have to know to answer the question. Then he noticed the list multiplied into a number.

$$N = R_* \cdot f_p \cdot n_e \cdot f_l \cdot f_i \cdot f_c \cdot L$$

$N$ is the number of civilizations in the Milky Way we could talk to right now. Everything else is a step on the way there:

- $R_*$: how many stars the galaxy makes per year.
- $f_p$: the fraction of those stars that have planets.
- $n_e$: how many planets per system could hold life.
- $f_l$: the fraction of those where life actually starts.
- $f_i$: the fraction of those where life becomes intelligent.
- $f_c$: the fraction of those that build something we could detect from far away, like radio.
- $L$: how many years a civilization keeps sending those signals.

The SETI Institute explains it with a university. If a school admits 1,000 students a year and each one stays four years, there are about 4,000 students on campus at any time. Admissions per year times years of stay. The first six factors are the galaxy's admissions office (new talking civilizations per year), and $L$ is how long each one stays enrolled.

Drake never meant it as a calculator. It was a list of things we didn't know, written so ten people would know what to argue about for two days. They argued well: the group even named itself the Order of the Dolphin, after John Lilly's work on dolphin intelligence.

## What we knew then, and what we know now

In 1961, every number after $R_*$ was a guess. Today the first three have data behind them. The last four are still guesses (just better-dressed ones).

| Factor | Drake's group, 1961 | Today | Source |
|---|---|---|---|
| $R_*$ | 1 star per year | about 1.65 Suns' worth of new stars per year | Licquia & Newman, 2015 |
| $f_p$ | 0.2 to 0.5 | about 1: planets are the rule | Cassan et al., 2012 |
| $n_e$ | 1 to 5 | 0.37 to 0.60 rocky habitable-zone planets per Sun-like star | Bryson et al., 2021 |
| $f_l$ | 1 | unknown; life's early start on Earth favors "fast" at about 3:1 | Kipping, 2020 |
| $f_i$ | 1 | unknown; the same analysis slightly favors "rare" at 3:2 | Kipping, 2020 |
| $f_c$ | 0.1 to 0.2 | unknown | |
| $L$ | 1,000 to 100,000,000 years | unknown; we've been detectable for about 100 | |

With those 1961 ranges, $N$ came out anywhere between 20 and 50 million. That's a range so wide it's almost a joke, and that was the point: the answer depends almost entirely on $L$.

The planet rows are the ones that changed. When Drake wrote the equation, nobody had ever seen a planet outside the Solar System. As I write this, NASA's Exoplanet Archive lists 6,451 confirmed ones. Microlensing surveys found that a typical star has at least one planet, and Kepler data says that somewhere between a third and more than half of Sun-like stars have a rocky planet where water could be liquid.

<!-- FOTO 2: rascunho comparando os números de 1961 com os de hoje (pode ser a tabela feita à mão). -->

## The version with time in it

The classic equation has a hidden assumption: the galaxy is in a steady state. Stars are born at the same rate forever, and every civilization lives exactly $L$ years. Real galaxies don't work like that. The Milky Way made stars much faster when it was young, and a star born today won't have a civilization for billions of years (on Earth it took about 4.5 billion).

So several people rewrote the equation with time in it. Milan Ćirković made the case for it in 2004, and versions with different notation show up in Prantzos (2013), Balbi (2018), Panov (2018) and Madau (2023). It's a temporal generalization of the Drake equation, not one person's equation. This is the form I used:

$$N(t) = \int_0^{t} R_*(t')\, f_p\, n_e\, f_l\, f_i\, f_c\; S(t - t' - \tau)\, dt'$$

Read it from the inside out:

- $t'$ is the moment a star is born, and $R_*(t')$ is how many stars the galaxy made at that moment. It can change over time now.
- $f_p\, n_e\, f_l\, f_i\, f_c$ are the same fractions as before.
- $\tau$ is the delay between a star's birth and a civilization appearing around it. So a civilization from a star born at $t'$ shows up at $t' + \tau$, and at time $t$ it's $t - t' - \tau$ years old.
- $S$ is a survival function: the probability that a civilization of that age is still around and still sending signals.
- The integral adds this up over every moment a star could have been born, from the start of the galaxy until now.

In words: count the stars born at each moment in the galaxy's history, keep the ones that ended up with a civilization, and ask how many of those civilizations are still alive today.

<!-- FOTO 3: a integral escrita à mão, com setas explicando cada pedaço (t', τ, S). -->

## Where the integral turns into the blackboard

Now make two of Drake's assumptions. First, the galaxy always makes stars at the same rate, so $R_*(t') = R_*$. Second, every civilization lives exactly $L$ years and then goes quiet. That makes $S$ a step: it's 1 for ages between $0$ and $L$, and 0 otherwise.

With the first assumption, the constant comes out of the integral:

$$N(t) = R_*\, f_p\, n_e\, f_l\, f_i\, f_c \int_0^{t} S(t - t' - \tau)\, dt'$$

Now change variables to the civilization's age, $u = t - t' - \tau$. When $t'$ goes from $0$ to $t$, $u$ goes from $t - \tau$ down to $-\tau$, and $dt' = -du$:

$$\int_0^{t} S(t - t' - \tau)\, dt' = \int_{-\tau}^{\,t - \tau} S(u)\, du$$

$S(u)$ is 1 only between $0$ and $L$. As long as the galaxy is older than $\tau + L$ (it is, by a lot), that whole window is inside the limits, so the integral is just the width of the step:

$$\int_{-\tau}^{\,t - \tau} S(u)\, du = \int_0^{L} 1\, du = L$$

And we're back at the blackboard:

$$N = R_* \cdot f_p \cdot n_e \cdot f_l \cdot f_i \cdot f_c \cdot L$$

The 1961 equation is the steady-state case of the integral. The "hard" formula and the "easy" one are the same thing; the integral just remembers that the galaxy has a past. Same as the university: admissions per year times years of stay only works if admissions didn't change and everyone stays exactly four years.

<!-- FOTO 4: a demonstração feita no papel, com a substituição u = t − t′ − τ e o degrau de largura L desenhado. -->

## So why is it so quiet?

If planets are everywhere, where is everybody? That's Fermi's question, and Michael Hart turned it into a paradox in 1975. Two answers I find convincing don't need anything exotic.

First, we've barely looked. Jason Wright and his colleagues measured how much of the possible search space radio SETI has covered, and compared it to checking a large hot tub's worth of water from all of Earth's oceans for fish. Finding no fish in a hot tub doesn't say much about the ocean.

Second, multiplying "typical" values hides how little we know. Anders Sandberg, Eric Drexler and Toby Ord redid the math with the real uncertainty of each factor, which spans many orders of magnitude for $f_l$ and $f_i$. The answer becomes a distribution instead of a number, and a big part of that distribution says we're alone in the galaxy. Then the silence isn't a paradox anymore. It's one of the likely outcomes.

On the other side, Adam Frank and Woody Sullivan flipped the question: with the habitable planets we already know about, humanity is the only technological species in the universe's history only if the chance per planet is below about $10^{-24}$. And Tom Westby and Christopher Conselice estimated that if Earth is typical, there should be at least 36 civilizations in the Milky Way right now, the nearest one roughly 17,000 light-years away. That's too far to hear us, and it assumes each one lasts only 100 years, which is about how long we've been detectable.

<!-- FOTO 5: algum rascunho seu sobre o paradoxo de Fermi ou sobre o L (se tiver). -->

## What I think

Every factor in that equation is somebody's job. $R_*$ belongs to the astronomers, $f_p$ and $n_e$ to the Kepler people, $f_l$ to the chemists, $f_i$ to the biologists. Then there's $L$, and nobody owns $L$. It isn't a question about the galaxy. It's a question about us: how long a civilization keeps the lights on after it learns to build a transmitter.

I think $L$ is an engineering problem, and a budget problem, long before it's an astronomy problem. Adam Frank makes the long version of that argument in *Light of the Stars*: civilizations change their planet's climate by using energy, and the ones that last are the ones that notice in time. My version is shorter. The truck in my grandfather's garage didn't die because of its engine. It died because of a fuse that cost less than a coffee, which we found after replacing three expensive parts. My father's clinic nearly closed over paperwork, not dentistry. In both cases the dangerous part was the cheap, boring one nobody was watching.

Keeping a civilization running is mostly cheap, boring parts: schools with a lab, clean water, fuses. Project Candela is 140 physics kits in 28 public schools that had no lab. On the scale of the galaxy, that rounds to zero. On the scale of $L$, it's the whole game: 3,000 students ran their first experiment and found out that the wall between "broken" and "working" is thinner than it looks. I count each of them as a small vote for a bigger $L$.

The other thing I believe is that Drake was right to treat his equation as an agenda and not a calculator. Sixty-five years later, the three factors that got answers are the three someone built an instrument to measure. Kepler stared at 150,000 stars for four years, and $f_p$ and $n_e$ went from guesses to data. The four factors that didn't get answers are the ones nobody has figured out how to measure yet. Read that way, the equation is less a formula than a to-do list, and it tells you what to build next.

So I was half right at 14. It wasn't impossible. It was seven things nobody had measured, and three of them had just been crossed off.

That's why the essay that sent you here ends where it does: first the people near me, then wherever the Drake equation says there's someone to teach.

---

## Sources

- Drake, F. & Sobel, D. (1992). *Is Anyone Out There?* Delacorte. Drake's own account of the 1961 blackboard.
- SETI Institute. [The Drake Equation](https://www.seti.org/drake-equation-index).
- Astronomy Magazine. [The Order of the Dolphin: SETI's secret origin story](https://www.astronomy.com/science/the-order-of-the-dolphin-setis-secret-origin-story/).
- Wikipedia. [Drake equation](https://en.wikipedia.org/wiki/Drake_equation), for the 1961 values.
- Ćirković, M. M. (2004). [The Temporal Aspect of the Drake Equation and SETI](https://arxiv.org/abs/astro-ph/0306186). *Astrobiology* 4(2).
- Prantzos, N. (2013). [A joint analysis of the Drake equation and the Fermi paradox](https://arxiv.org/abs/1301.6411). *International Journal of Astrobiology* 12(3).
- Balbi, A. (2018). [The Impact of the Temporal Distribution of Communicating Civilizations on their Detectability](https://arxiv.org/abs/1708.07433). *Astrobiology* 18(1).
- Panov, A. D. (2018). [Dynamical generalizations of the Drake equation](https://arxiv.org/abs/1805.09058).
- Madau, P. (2023). [Beyond the Drake Equation](https://arxiv.org/abs/2309.11927).
- Licquia, T. C. & Newman, J. A. (2015). [Improved Estimates of the Milky Way's Stellar Mass and Star Formation Rate](https://arxiv.org/abs/1407.1078). *ApJ* 806, 96.
- Cassan, A. et al. (2012). [One or more bound planets per Milky Way star from microlensing observations](https://arxiv.org/abs/1202.0903). *Nature* 481.
- Bryson, S. et al. (2021). [The Occurrence of Rocky Habitable-zone Planets around Solar-like Stars from Kepler Data](https://arxiv.org/abs/2010.14812). *AJ* 161, 36.
- NASA. [Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/), count checked on November 5, 2026.
- Kipping, D. (2020). [An objective Bayesian analysis of life's early start and our late arrival](https://arxiv.org/abs/2005.09008). *PNAS* 117(22).
- Hart, M. H. (1975). [An Explanation for the Absence of Extraterrestrials on Earth](https://ui.adsabs.harvard.edu/abs/1975QJRAS..16..128H). *QJRAS* 16.
- Wright, J. T., Kanodia, S. & Lubar, E. (2018). [How Much SETI Has Been Done?](https://arxiv.org/abs/1809.07252) *AJ* 156, 260.
- Sandberg, A., Drexler, E. & Ord, T. (2018). [Dissolving the Fermi Paradox](https://arxiv.org/abs/1806.02404).
- Frank, A. & Sullivan, W. T. (2016). [A New Empirical Constraint on the Prevalence of Technological Species in the Universe](https://arxiv.org/abs/1510.08837). *Astrobiology* 16(5).
- Westby, T. & Conselice, C. J. (2020). [The Astrobiological Copernican Weak and Strong Limits for Intelligent Life](https://arxiv.org/abs/2004.03968). *ApJ* 896, 58.
