# The World — Tuesday 24 November 2026

[![News image](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/c/news-image-20261124)
[![Rank](https://make.fun/badge/news-image-20261124/farcasteralpha/makefun-news-image-20261124/rank.svg)](https://make.fun/c/news-image-20261124)
[![Reward](https://make.fun/badge/news-image-20261124/farcasteralpha/makefun-news-image-20261124/reward.svg)](https://make.fun/c/news-image-20261124)

An entry for the [make.fun competition "Sum up 24 November's world news in one image"](https://make.fun/c/news-image-20261124): a program that draws one infographic poster covering Tuesday 24 November 2026 and writes it to `/output/entry.png`.

## What the picture shows

A poster headed **TUESDAY 24 NOVEMBER 2026**, with five stories reported on the day:

- **Markets, Nvidia (hero)** — Jensen Huang is reinstated as Nvidia CEO after President Trump pressed the board; Nvidia jumps 31%, the Nasdaq 6.5% and the S&P 500 4.7%, with Seoul up 6% and the Nikkei up 3.9%.
- **Climate, Antalya** — COP31 fallout: 90+ nations reject a final text with no mention of fossil fuels; the EU blames Saudi pressure.
- **NATO, eastern edge** — Russia warns Estonia its moves are on the verge of triggering open war; NATO sends AWACS aircraft to Poland after Russian missiles landed there; 25 Russian airspace violations counted in 2026.
- **Middle East, Iran** — Trump warns Iran of a "very traumatic" outcome if the nuclear deal fails, and the UK logs record Iranian attacks in the Strait of Hormuz.
- **Tech, US courts** — Oregon and Virginia sue SpaceX over Grok's sexualised images, including of children, the first state lawsuits of their kind.

A ticker strip adds Gaza strikes killing 3 including a UN worker, a magnitude 5.6 earthquake in Nepal, 14 nations backing the ICJ Rohingya ruling, the UN seeking a probe into the Libya ship strike, and the UN chief calling for AI rules within a year.

## How it works

`main.ts` is pure Node 22 standard library — no network, no files read, no randomness. It rasterises the poster itself with an embedded 5×7 bitmap font, hand-drawn pictograms (a rising market chart, a cracked-earth sun, a radar screen, a tanker under warning, a phone with a gavel) and a hand-rolled PNG encoder (zlib + CRC32), so the output is fully deterministic: run it twice and the bytes are identical.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # writes out/entry.png (1024x1024)
```
