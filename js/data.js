/* ケロちゃん みるみる — the game's data: ranks, the five eye powers, trainings, the eye facts and
   ケロはかせ's lines. Shared by the browser game and the Node.js tools. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Data = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Result ranks, 1 ... 7 (best): animals from the weakest eyes to the sharpest.
  var ANIMALS = [
    { id: 'mole', name: 'もぐら', fact: 'もぐらは つちの なかで くらすから、あかるいか くらいかが わかる くらい なんだって' },
    { id: 'dog', name: 'いぬ', fact: 'いぬは うごいて いる ものを みつけるのが とくい だよ' },
    { id: 'cat', name: 'ねこ', fact: 'ねこは くらい ところでも よく みえるよ' },
    { id: 'owl', name: 'ふくろう', fact: 'ふくろうは よるでも えものを みつけられるよ' },
    { id: 'chameleon', name: 'カメレオン', fact: 'カメレオンは みぎと ひだりの めを べつべつに うごかせるよ' },
    { id: 'dragonfly', name: 'トンボ', fact: 'トンボは まわりが ぐるっと ぜんぶ みえるんだって' },
    { id: 'eagle', name: 'わし', fact: 'わしは たかい そらから じめんの ちいさな どうぶつも みつけられるよ' }
  ];

  // The groups on the list: the five eye powers of the original (each with two basic trainings) and sports.
  var CATS = [
    { id: 'dotai', name: 'うごきを みる', sub: '動体視力', color: '#ffb347', c1: '#ffdcae', c2: '#fff4e4', theme: 5 },
    { id: 'shunkan', name: 'いっしゅんで みる', sub: '瞬間視', color: '#6cc6ff', c1: '#c2e8ff', c2: '#eff9ff', theme: 0 },
    { id: 'gankyu', name: 'めを うごかす', sub: '眼球運動', color: '#ff8fc0', c1: '#ffcde2', c2: '#fff1f7', theme: 1 },
    { id: 'shuhen', name: 'まわりを みる', sub: '周辺視野', color: '#86d65c', c1: '#ccf1bb', c2: '#f1fbea', theme: 4 },
    { id: 'kyoou', name: 'みて タッチ', sub: '眼と手の協応', color: '#b58cff', c1: '#e3d4ff', c2: '#f7f2ff', theme: 3 },
    { id: 'sports', name: 'スポーツ', sub: '', color: '#ffd23d', c1: '#fff0b0', c2: '#fffbe6', theme: 2 }
  ];

  // Trainings in list order. unlock = stamps needed before it opens (one more menu with every stamp, as in the original).
  var TRAININGS = [
    { id: 'shuffle', cat: 'dotai', unlock: 0 },
    { id: 'rushcount', cat: 'dotai', unlock: 1 },
    { id: 'flashnum', cat: 'shunkan', unlock: 0 },
    { id: 'flashmark', cat: 'shunkan', unlock: 2 },
    { id: 'triplec', cat: 'gankyu', unlock: 0 },
    { id: 'countc', cat: 'gankyu', unlock: 3 },
    { id: 'peric', cat: 'shuhen', unlock: 0 },
    { id: 'updownc', cat: 'shuhen', unlock: 4 },
    { id: 'quicktouch', cat: 'kyoou', unlock: 0 },
    { id: 'numtouch', cat: 'kyoou', unlock: 5 },
    { id: 'baseball', cat: 'sports', unlock: 0 },
    { id: 'boxing', cat: 'sports', unlock: 6 },
    { id: 'pingpong', cat: 'sports', unlock: 7 },
    { id: 'basket', cat: 'sports', unlock: 8 },
    { id: 'volley', cat: 'sports', unlock: 9 },
    { id: 'soccer', cat: 'sports', unlock: 10 },
    { id: 'football', cat: 'sports', unlock: 11 }
  ];
  // むずかしい opens with a good result at ふつう (this rank or better) or after this many stamps.
  var HARD_RANK = 5, HARD_STAMPS = 10;

  // The daily eye check: one test for each eye power, one of its two basic trainings.
  var CHECK = [
    { id: 'dotai', name: 'うごき', tests: ['shuffle', 'rushcount'], good: 'うごく ものを みるのが とくい だね！' },
    { id: 'shunkan', name: 'いっしゅん', tests: ['flashnum', 'flashmark'], good: 'いっしゅんで みるのが とくい だね！' },
    { id: 'gankyu', name: 'めの うごき', tests: ['triplec', 'countc'], good: 'めを うごかすのが とくい だね！' },
    { id: 'shuhen', name: 'まわり', tests: ['peric', 'updownc'], good: 'まわりを みるのが とくい だね！' },
    { id: 'kyoou', name: 'タッチ', tests: ['quicktouch', 'numtouch'], good: 'みて すぐ タッチするのが とくい だね！' }
  ];

  // The grown-ups' three levels (おとな) are near the original game's stages; only grown-up users see them.
  // hard: a むずかしい opens after a good result at that level (or with stamps), as in the original.
  var LEVELS = [
    { id: 'e', name: 'かんたん', dots: 1 },
    { id: 'n', name: 'ふつう', dots: 2 },
    { id: 'h', name: 'むずかしい', dots: 3, hard: 'n' },
    { id: 'ae', name: 'おとな かんたん', short: 'かんたん', dots: 1, adult: true },
    { id: 'a', name: 'おとな ふつう', short: 'ふつう', dots: 2, adult: true },
    { id: 'ah', name: 'おとな むずかしい', short: 'むずかしい', dots: 3, adult: true, hard: 'a' }
  ];

  // Pictures (drawn in pics.js) used by かぞえて びゅん.
  var PICS = [
    { id: 'dog' }, { id: 'cat' }, { id: 'umbrella' }, { id: 'shoe' }, { id: 'star' }, { id: 'flower' }, { id: 'crab' }, { id: 'peach' },
    { id: 'apple' }, { id: 'strawberry' }, { id: 'egg' }, { id: 'chick' }, { id: 'frog' }, { id: 'rabbit' }, { id: 'watermelon' },
    { id: 'grapes' }, { id: 'mandarin' }, { id: 'fish' }, { id: 'hat' }, { id: 'car' }, { id: 'riceball' }, { id: 'balloon' },
    { id: 'sunflower' }, { id: 'mitten' }, { id: 'pencil' }, { id: 'snail' }, { id: 'cherry' },
    // (added 2026-09-29, the same pictures as in あたま ぐんぐん)
    { id: 'bear' }, { id: 'cow' }, { id: 'turtle' }, { id: 'monkey' }, { id: 'elephant' }, { id: 'moon' }, { id: 'cloud' }, { id: 'house' },
    { id: 'boat' }, { id: 'octopus' }, { id: 'bread' }, { id: 'top' }, { id: 'rainbow' }, { id: 'mushroom' }, { id: 'glasses' }, { id: 'banana' },
    { id: 'lemon' }, { id: 'tomato' }, { id: 'mouse' }, { id: 'panda' }, { id: 'giraffe' }, { id: 'drum' }, { id: 'book' }, { id: 'scissors' },
    { id: 'ghost' }, { id: 'plane' }, { id: 'lion' }, { id: 'penguin' }, { id: 'owl' }, { id: 'acorn' }, { id: 'carrot' }, { id: 'crown' },
    { id: 'snowman' }, { id: 'beetle' }, { id: 'corn' }, { id: 'ladybug' }
  ];

  // The eye facts: one a day before the first training, 48 days (as in the original), kept in まめちしき.
  var TIPS = [
    'めは いつも まばたきを して、めの おもてを きれいに して いるよ。1ぷんに 20かいくらい まばたき するんだって',
    'なみだには、めを ばいきんから まもる ちからが あるよ',
    'ねこの めの おくには、ひかりを はねかえす かがみのような ところが あるよ。だから くらくても よく みえるんだって',
    'トンボの めは、ちいさな めが 1まんこ いじょう あつまって できて いるよ',
    'わしは とても めが いいよ。たかい そらから じめんの ちいさな どうぶつも みつけられるんだって',
    'カメレオンは みぎと ひだりの めを べつべつに うごかせるよ',
    'ふくろうは めを うごかせないから、くびを くるっと まわして みるんだよ',
    'もぐらは つちの なかで くらすから、めは とても ちいさいよ',
    'ちかくばかり みて いると めが つかれるよ。ときどき とおくを みようね',
    'とおくの みどりを ながめると、めが ほっと するよ',
    'くらい ところで えほんを よむと めが つかれやすいよ。あかるい ところで よもうね',
    'くろめの まんなかの「ひとみ」は、あかるいと ちいさく、くらいと おおきく なるよ。かがみで みて みよう',
    'まつげは、ほこりや ごみが めに はいらないように まもって くれるよ',
    'まゆげは、あせが めに はいらないように して くれるよ',
    'みぎめと ひだりめは すこし ちがう ばしょから みて いるよ。だから ものの とおさが わかるんだって',
    'かたほうの めを てで かくして ゆびを みて みよう。かくす めを かえると ゆびが うごいて みえるよ',
    'うさぎの めは かおの よこに ついて いるから、うしろの ほうまで みえるよ',
    'タコや イカにも めが あるよ。とても よく みえるんだって',
    'ヘビの なかまには、あたたかい ものを かんじる あなを もつ ものが いるよ。くらくても えものが わかるんだって',
    'うまの めは とても おおきくて、ほとんど ぐるっと まわりが みえるよ',
    'めを ぎゅっと つぶって ぱっと ひらくと、めの まわりの たいそうに なるよ',
    'テレビや タブレットは、はなれて みようね。ちかすぎると めが つかれるよ',
    'がめんを ずっと みたら、ときどき めを やすめようね',
    'そとで あそぶ ことは、めに いいと いわれて いるよ',
    'ひとの めには、いろを みわける ための 3しゅるいの センサーが あるよ。あか・みどり・あお だよ',
    'ミツバチには、ひとには みえない ひかりが みえるんだって',
    'いぬは いろの みえかたが ひとと ちがって、あかと みどりが にて みえるんだって',
    'めの いろ（くろ・ちゃいろ・あお など）は、ひとみの まわりの「こうさい」の いろ だよ',
    'あかちゃんは うまれた ときは あまり よく みえないよ。だんだん みえるように なるんだって',
    'ボールを さいごまで よく みると、じょうずに キャッチ できるよ',
    'うごいて いる ものを はっきり みる ちからを「どうたいしりょく」と いうよ。スポーツで だいかつやく！',
    'いっしゅんで たくさんの ものを みる ちからを「しゅんかんし」と いうよ',
    'まえを みたまま、まわりの ものに きづく ちからを「しゅうへんしや」と いうよ',
    'めで みて すぐに てを うごかす ちからを「めと ての きょうおう」と いうよ',
    'めを すばやく うごかす ちからを「がんきゅう うんどう」と いうよ。えほんを よむ ときにも つかうよ',
    'シマウマの しましまは、たくさん あつまると 1とうずつ みわけにくく なると いわれて いるよ',
    'まっくらな へやでも、しばらく すると だんだん みえて くるよ。めが くらさに なれるんだって',
    'めは みた ものを「のう」に おくって いるよ。ものを みるのは、めと のうの チームプレー なんだ',
    'ゆうがた くらく なると、いろが みわけにくく なるよ',
    'あくびを すると なみだが でるのは、めの まわりが ぎゅっと うごくから だと いわれて いるよ',
    'めを こすると ばいきんが はいる ことが あるよ。かゆい ときは おうちの ひとに いおうね',
    'サングラスは、まぶしい ひかりから めを まもって くれるよ',
    'ぼうしの つばも、まぶしい ひかりから めを まもって くれるよ',
    'おひさまを ちょくせつ みては いけないよ。めが いたく なって しまうよ',
    'やさいや さかなを しっかり たべると、めの げんきにも いいと いわれて いるよ',
    'よる しっかり ねむると、めも ゆっくり やすめるよ',
    'ハチには おおきな めが 2つと、ちいさな めが 3つ あるんだって',
    'めの たいそうを まいにち すると、めを うごかすのが じょうずに なるよ。いっしょに がんばろうね！'
  ];

  // ケロはかせ's lines.
  var LINES = {
    morning: 'おはよう！', day: 'こんにちは！', night: 'こんばんは！',
    title: ['きょうも めの たいそう しよう！', 'まいにち すこしずつ やると めぢからが ぐんぐん つくよ', 'どの トレーニングに する？'],
    first: 'はじめまして！ ケロはかせ だよ。まいにち いっしょに めの たいそう しようね！',
    checkFirst: 'まずは きょうの めチェックから やってみる？',
    enough: 'きょうは たくさん がんばったね！ めを やすめて、つづきは また あした！',
    newTraining: 'あたらしい トレーニングが ふえたよ！',
    newHard: '「むずかしい」で あそべるように なったよ！',
    best: ['すごい！ いままでで いちばんだよ！', 'じこベスト！ やったね！'],
    first1: ['はじめての きろく だね！', 'よく できました！'],
    good: ['よく できました！', 'いい ちょうし！', 'がんばったね！', 'すばらしい！'],
    soso: ['だいじょうぶ！ ゆっくりで いいよ', 'つぎは もっと できるよ！', 'まいにち やると ぐんぐん のびるよ'],
    practice: 'はじめてなら「れんしゅう」で ためせるよ',   // (under the levels, until the training has been played)
    practiceDone: 'じょうず！ こんどは ほんとうに やってみよう！',
    tip: 'きょうの めの まめちしき！',
    record: 'しんきろく！ すごい！',
    pause: 'ちょっと おやすみ'
  };

  // The eye stretch: [what ケロはかせ says, how long (s), what the star does].
  var STRETCH = [
    ['めの ストレッチ、はじめるよ！ かおは うごかさないで、めだけで ほしを おいかけてね', 3.5, 'intro'],
    ['うえ と した', 6, 'updown'],
    ['みぎ と ひだり', 6, 'leftright'],
    ['ななめ', 6, 'diagonal'],
    ['ぐるっと まわして', 7, 'circle'],
    ['ちかく と とおく', 7, 'nearfar'],
    ['ぎゅっと つぶって…… ぱっ！', 5, 'blink'],
    ['てのひらで めを おおって、あったかく しよう', 6, 'palm'],
    ['おしまい！ めが すっきり したね', 3, 'end']
  ];

  return {
    ANIMALS: ANIMALS, CATS: CATS, TRAININGS: TRAININGS, HARD_RANK: HARD_RANK, HARD_STAMPS: HARD_STAMPS,
    CHECK: CHECK, LEVELS: LEVELS, PICS: PICS, TIPS: TIPS, LINES: LINES, STRETCH: STRETCH
  };
}));
