/**
 * Eight palettes to start from, each described by how it feels in the mouth: soft and coastal,
 * hard highland and so on. They are never named after a real language or people, and none is a
 * copy of one. Each is a handful of choices (which sounds, which syllables, which endings), and
 * `about` says which choices give it its feel, so a person can make the same moves themselves.
 */
import { sanitise, type Language } from './model';

export interface Preset {
  /** Its name in a link: lower-case letters only. Never changes once released. */
  id: string;
  /** "Soft and coastal" */
  title: string;
  /** "soft, open vowels": what you hear, in a few words. */
  feel: string;
  /** Which choices make it sound that way. */
  about: string;
  /** A seed that shows it well, for the presets page and the examples. */
  seed: number;
  language: Language;
}

const preset = (id: string, title: string, feel: string, seed: number, about: string, language: Record<string, unknown>): Preset => ({
  id,
  title,
  feel,
  about,
  seed,
  language: sanitise(language),
});

const pattern = (weight: number, affixes: string) => ({ on: true, weight, affixes });

export const PRESETS: readonly Preset[] = [
  preset(
    'coastal',
    'Soft and coastal',
    'soft, open vowels',
    4471,
    'Mostly l, n, r, s and m, with few hard stops, and syllables that end in a vowel more often than not. Names roll on without a bump: little clusters and nothing ends abruptly.',
    {
      name: 'Coastal',
      consonants: 'l*16 n*16 r*14 s*12 m*12 t*10 v*8 k*7 d*6 p*3',
      vowels: 'a*20 e*14 i*12 o*8 u*5 ae*2',
      shapes: 'CV*62 CVC*24 V*7 VC*7',
      banned: 'pv kv dv tv vt vk vd vp td dt kd dk pt tp kp pk mv vm sd ds nm mn lr rl nl sr vs pm pn km dm dn tm tn vl vn vr vv pp dd kk',
      length: { place: [2, 3], given: [2, 3], surname: [2, 3] },
      places: { endings: 'vin*12 holm*8 ara una*8 mar*8 el*6', bare: 35 },
      given: { gendered: true, feminine: 'a*14 ia*6 sa*5 ela*4', masculine: 'o*10 ir an*8 ko*5', either: 'in*10 i*6', bare: 25 },
      surnames: { patronymic: pattern(10, '-ko -is*6 -sen*4'), place: pattern(8, '-in -ano*6 del_*4'), trade: pattern(7, '-li -ar*8 -in*6') },
    },
  ),
  preset(
    'highland',
    'Hard highland',
    'hard stops, short words',
    1213,
    'Built on k, g, t, d and r, with syllables that close on a consonant and words that stop dead. Vowels are few and plain, so the consonants do the talking.',
    {
      name: 'Highland',
      consonants: 'k*16 r*16 g*12 t*12 d*12 n*10 b*8 m*8 l*6 kh*5^3 th*4 gr*5^3$0 dr*5^3$0 br*4^3$0 rk*4^0 rn*4^0 ld*3^0',
      vowels: 'a*18 o*14 u*10 e*8 i*6',
      shapes: 'CVC*58 CV*26 VC*12 V*4',
      banned: 'kg gk td dt bk kb gd dg tk kt db bd gb bg nm mn lr rl rr ll nn mm gg kk dd tt bb khk thh dth tth khg thk thg khth thkh mk mg nb lk lg kn gn tn dn bn km gm tm dm kl tl dl hb hd hg ht hn hm hl khr thr',
      length: { place: [1, 2], given: [1, 2], surname: [1, 2] },
      places: { endings: 'dun*12 garth*8 rok mor*8 bren*6 crag*5', bare: 30 },
      given: { gendered: true, feminine: 'a*10 eth*8 una*5', masculine: 'ak or*8 un*6 ach*5', either: 'an', bare: 30 },
      surnames: { patronymic: pattern(10, 'mac-*8 -son*4 dur-'), place: pattern(6, '-er of_*4'), trade: pattern(8, '-ar -man*5') },
    },
  ),
  preset(
    'steppe',
    'Long-vowelled steppe',
    'long vowels, wide open',
    2718,
    'Long vowels (aa, uu, oo) sit beside short ones, and kh, g and q come from the back of the mouth. Words are long and level, with room in the middle of them.',
    {
      name: 'Steppe',
      consonants: 't*14 r*14 n*14 kh*10 g*10 b*10 d*8 l*8 m*8 s*8 sh*6 q*3 z*5 y*5$0 ch*4$0',
      vowels: 'a*16 aa*12 u*8 uu*8 o*7 oo*5 e*8 i*6 ai*2',
      shapes: 'CV*58 CVC*32 VC*6 V*4',
      banned: 'khkh shsh khg gkh qk kq qg gq qkh khq tch dch tsh sht ssh shs zs sz zsh shz rr ll nn mm tt dd bb gg ss zz qq td dt bd db ln nl lr rl mn nm bg gb gk kg sr zr shr tb tg dg db bt gt gd tq dq bq qt qd qb',
      length: { place: [2, 3], given: [2, 2], surname: [2, 2] },
      places: { endings: 'tal*12 dur uul*8 gar*8 shan*6 baat*4', bare: 30 },
      given: { gendered: true, feminine: 'aa*10 ai*8 gul*5 maa*5', masculine: 'ur an*8 bek*4 dai*5', either: 'el*6', bare: 25 },
      surnames: { patronymic: pattern(12, '-uun -gin*8 -yn*5'), place: pattern(6, '-ch*6 -tai'), trade: pattern(6, '-chi -gar*5') },
    },
  ),
  preset(
    'imperial',
    'Latinate imperial',
    'stately, built for inscriptions',
    1453,
    'Clean consonants, five pure vowels and endings that tell you what a word is: -ium for a city, -a and -us for a person. It sounds like something carved over a gate.',
    {
      name: 'Imperial',
      consonants: 't*14 r*14 l*13 n*13 s*12 c*10$0 m*10 v*8$0 d*7$0 p*6$0 g*4$0 f*4$0 b*3$0 qu*3$0 x*2^0',
      vowels: 'a*18 i*14 e*12 u*10 o*9 au*2$0 ae*2',
      shapes: 'CV*60 CVC*26 V*7 VC*7',
      banned: 'rr ss ll nn mm tt nm mn lr rl sr sd sv sg sb sf mv md mt mc mg mf mqu ml mr ms nv np nb nf nl nr lv ld lp lm ln lc ls lg lb lf lqu tn tm tl tv td tp tc tg tb tf ts tqu rv rf rqu xt xn xm xl xr xs quu xu',
      length: { place: [2, 3], given: [2, 3], surname: [2, 3] },
      places: { endings: 'ium*12 a*8 ia um*8 ona*6 entia*4 polis*3', bare: 15 },
      given: { gendered: true, feminine: 'a*12 ia ina*6 illa*4', masculine: 'us*14 ius o*5 ian*5', either: 'is*6', bare: 10 },
      surnames: { patronymic: pattern(10, '-ius -anus*6 -ides*4'), place: pattern(7, '-ensis*6 -anus de_*5'), trade: pattern(7, '-arius -or*6') },
    },
  ),
  preset(
    'forest',
    'Hushed forest',
    'breathy, half-whispered',
    3141,
    'Almost no hard stops: th, s, sh, h, l and w carry it, with light vowels and the odd y. Say a few of these aloud and you find you have lowered your voice.',
    {
      name: 'Forest',
      consonants: 'l*16 n*14 th*12 s*12 r*10 h*8$0 w*8$0 m*8 sh*7 f*6$0 v*5$0 d*3$0 t*3$0',
      vowels: 'e*18 i*14 a*14 ae*5 ei*5$1 y*4^0 o*4 u*3',
      shapes: 'CV*58 CVC*20 V*10 VC*12',
      banned: 'thth shsh ths sth shs ssh thsh shth nn mm rr ss nm mn lr rl thl thn thm thr shl shn shm shr sr sn sm sl ml mr mth msh ms nl nr lsh lm ln rm rn rsh nsh sf sv mh nh lh rh thh shh tht thf shf thv shv mf mv mw shw thd shd md yy wu wy uw',
      length: { place: [2, 3], given: [2, 3], surname: [2, 3] },
      places: { endings: 'wen*10 lith eth*8 shae*6 ael*6 mere*5', bare: 30 },
      given: { gendered: true, feminine: 'iel eth*8 a*6 wen*5', masculine: 'ion el*8 ir*8 as*4', either: 'en*8 is*5', bare: 20 },
      surnames: { patronymic: pattern(8, '-ion -iel*6 sil-*4'), place: pattern(8, '-or*6 of_*5 -wyn'), trade: pattern(8, '-ath -ir*6') },
    },
  ),
  preset(
    'desert',
    'Dry desert',
    'throaty, clipped',
    1001,
    "Sounds from the back of the throat (q, kh, h and the catch written ') around short a, i and u. Syllables are tight and evenly weighted, like footsteps.",
    {
      name: 'Desert',
      consonants: "r*14 s*12 k*10 d*10 m*10 n*10 t*9 h*9 l*8 z*8 b*8 q*7 kh*7 sh*7 j*6$0 f*5 '*3^0$0",
      vowels: 'a*26 i*12 u*10 e*4',
      shapes: 'CVC*42 CV*46 VC*8 V*4',
      banned: "qq kk khkh shsh hh qk kq qkh khq khk kkh khh hkh hq qh hk ssh shs zs sz zsh shz td dt db bd bt tb bk kb bq qb dq qd tq qt dk kd tk kt fb bf rr ll mm nn ss zz dd tt bb ff nm mn lr rl lq nq mq mh nh lh rh hs hz hf hd ht hb",
      length: { place: [2, 3], given: [2, 2], surname: [2, 3] },
      places: { endings: 'ar*12 ad un*8 esh*6 abad*4 zar*6', bare: 30 },
      given: { gendered: true, feminine: 'a*12 ah*8 et*5 ira*5', masculine: 'ar im*8 ud*6 an*6', either: 'i*8', bare: 25 },
      surnames: { patronymic: pattern(12, 'ul_ -i*6 bar_*4'), place: pattern(8, '-i -ani*6'), trade: pattern(6, '-ji -dar*6') },
    },
  ),
  preset(
    'island',
    'Open island',
    'few sounds, every syllable open',
    8080,
    'Eight consonants, five vowels and no syllable ever ends in a consonant. A few vowel pairs (ai, au, ei, oa, ia, ua) count as one sound each, so the names are easy to sing and hard to mumble.',
    {
      name: 'Island',
      consonants: 'k*16 n*14 l*14 m*12 h*10 p*9 t*8 w*6',
      vowels: 'a*30 i*14 o*13 u*10 e*9 ai*5 au*3$0 ei*3 oa*3 ia*4^1 ua*3^0',
      shapes: 'CV*84 V*16',
      banned: 'wu wo woa wua',
      length: { place: [2, 3], given: [2, 3], surname: [2, 3] },
      places: { endings: 'lua*8 nei ono*8 uma*6 lohe*5 ke*6', bare: 45 },
      given: { gendered: false, feminine: '', masculine: '', either: 'a*8 i*8 lei*5 no*5', bare: 45 },
      surnames: { patronymic: pattern(6, 'ka-*6 -lani*5 a_'), place: pattern(10, 'o_ -ka*5'), trade: pattern(6, '-nui -ke*6') },
    },
  ),
  preset(
    'north',
    'Clustered north',
    'consonant clusters, compound names',
    1066,
    'Consonants arrive in pairs (sk, st, br, fj at the front; rd, lm, ng at the back) around short vowels, and places are compounds with a second half you soon recognise. Sturdy, with plenty to chew on.',
    {
      name: 'North',
      consonants: 'r*14 n*12 l*10 s*10 t*9 k*9 d*8 g*8 v*7$0 h*7$0 f*6 m*6 b*5$0 th*4 sk*6^3 st*7^3 br*5^3$0 tr*5^3$0 gr*5^3$0 fj*3^3$0 hr*3^3$0 sv*3^3$0 rd*5^0 rn*5^0 lm*3^0 ng*5^0 ld*4^0 nd*5^0 rg*3^0',
      vowels: 'a*18 e*12 i*12 o*10 u*8 y*4 ei*4 au*3',
      shapes: 'CVC*56 CV*30 VC*10 V*4',
      banned: 'rr ll nn ss tt kk dd gg ff mm nm mn lr rl td dt kg gk dk kd tg gt gd dg sr kt tk thf fth ths sth thk thg tht thd ngk ngg ngn ndn ndd ndt ldl ldd ldt rdr rdd rdt rnr rnn lml lmm rgr rgg rgk stt skk sts tst ksk fk fg fd ft',
      length: { place: [1, 2], given: [1, 2], surname: [1, 2] },
      places: { endings: 'holm*10 vik gard*8 dal*8 nes*6 by*5 fell*5', bare: 15 },
      given: { gendered: true, feminine: 'a*10 hild*6 run*6 dis*5', masculine: 'ar ulf*6 vald*6 grim*5 i*5', either: '', bare: 20 },
      surnames: { patronymic: pattern(14, '-sen -dottir*6 -son*6'), place: pattern(6, '-ing*6 -man*4'), trade: pattern(6, '-er -ar*6') },
    },
  ),
];

export const DEFAULT_PRESET = PRESETS[0]!;

export const presetById = (id: unknown): Preset | undefined => PRESETS.find((p) => p.id === id);
