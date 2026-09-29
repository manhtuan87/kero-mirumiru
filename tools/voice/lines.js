// Every fixed line ケロはかせ says, as { text, read }: `text` is exactly what the game passes to Voice.say
// (the key of the clip), `read` is what the voice engine reads (kanji give a more natural accent than
// plain hiragana). Names are not here: the game reads them with the phone's own voice.
'use strict';
global.Trainings = require('../../js/trainings.js');
global.Data = require('../../js/data.js');
const Data = global.Data;
const IDS = ['shuffle', 'rushcount', 'flashnum', 'flashmark', 'triplec', 'countc', 'peric', 'updownc', 'quicktouch', 'numtouch',
  'baseball', 'boxing', 'pingpong', 'basket', 'volley', 'soccer', 'football'];
IDS.forEach(id => require('../../js/tr/' + id + '.js'));
const T = global.Trainings, L = Data.LINES;

// the same as Voice.norm in js/voice.js
function norm(text) { return String(text).replace(/[★☆●○×♪〜～]/g, ' ').replace(/[\s　]+/g, ' ').trim(); }

const out = [], seen = {};
function add(text, read) {
  const key = norm(text);
  if (!key || seen[key]) return;
  if (read === undefined && /[A-Z]/.test(key)) throw new Error('give a reading for ' + key);
  seen[key] = true;
  out.push({ text: key, read: read || key.replace(/ /g, '') });
}

// ---------------------------------------------------------------- names and explanations, read more naturally in kanji
const TRAINING_READ = {
  shuffle: 'シャッフル', rushcount: '数えて、びゅん', flashnum: 'ぱっと数字', flashmark: 'ぱっと丸', triplec: 'トリプルシー',
  countc: '数えてシー', peric: 'まわりのシー', updownc: 'うえしたシー', quicktouch: '連続タッチ', numtouch: 'ナンバータッチ',
  baseball: '野球', boxing: 'ボクシング', pingpong: '卓球', basket: 'バスケット', volley: 'バレー', soccer: 'サッカー', football: 'アメフト'
};
const HELP_READ = {
  shuffle: 'コップのどれかに、ひよこがいるよ。コップが入れ替わるのを、目で追いかけて、ひよこがいるコップを、タッチしてね！',
  rushcount: '最初に出た絵と、同じ絵が、横にびゅんと流れるよ。いくつあったか、数えてね！',
  flashnum: '数字が、一瞬だけ出るよ。何の数字だったか、答えてね！',
  flashmark: 'いろいろなマークが、一瞬出るよ。丸があった場所を、タッチしてね！',
  triplec: 'いろいろな場所に、シーが出るよ。出た順番に、シーの開いてる方を、答えてね！',
  countc: '最初に出たシーと、同じ向きのシーが、いくつ出たか、数えてね！',
  peric: '真ん中のシーと、同じ向きのシーを、まわりから探して、タッチしてね！ 速さを測るよ。',
  updownc: '真ん中の星を、見ていてね。上と下に、シーが一瞬出るよ。同じ向きか、違う向きか、答えてね！',
  quicktouch: 'あちこちに、四角が出ては消えるよ。消える前に、素早くタッチしてね！',
  numtouch: '数字のパネルを、1から順番に、できるだけ速く、タッチしてね！',
  baseball: 'ピッチャーが、ボールを投げるよ。ボールがホームに来た時に、タッチして、打ち返そう！',
  boxing: 'トレーナーが出すミットを、素早くタッチしよう！ パンチが来たら、矢印の方へ、指をスライドして、よけてね。',
  pingpong: '相手が打ったボールが、飛んでくるよ。手前に来たボールを、タッチして、打ち返そう！ ラリーを続けてね。',
  basket: '選手が走ってくるよ。緑の服が味方、オレンジが相手。影になったら、味方をタッチしてね！',
  volley: '味方がボールを上げるよ。ボールが高いところ、白い帯に来たら、タッチしてスパイク！',
  soccer: '赤い相手が、邪魔をしているよ。邪魔されていない、緑の味方へ、ボールから指をスライドして、パス！',
  football: 'ボールを持って走るよ。相手が突っ込んでくるから、左か右をタッチして、よけてね！'
};
const ANIMAL_READ = { もぐら: 'モグラ', いぬ: '犬', ねこ: '猫', ふくろう: 'フクロウ', カメレオン: 'カメレオン', トンボ: 'トンボ', わし: 'ワシ' };
const CHECK_READ = {
  dotai: '動くものを見るのが、得意だね！', shunkan: '一瞬で見るのが、得意だね！', gankyu: '目を動かすのが、得意だね！',
  shuhen: 'まわりを見るのが、得意だね！', kyoou: '見てすぐタッチするのが、得意だね！'
};
const STRETCH_READ = [
  '目のストレッチ、始めるよ！ ケロはかせと一緒に、やってみよう。',
  '画面から目を離して、窓の外の遠くを見よう。20秒、じっと見てね。',
  'はい、戻ってきてね。次は、まばたきを3回やろう。',
  '顔は動かさないで、目だけで星を、ゆっくり追いかけてね。上と、下。',
  '右と、左',
  'ぐるっと回して',
  '目を閉じて、10秒休もう。',
  'はい、目を開けて。おしまい！ 目がすっきりしたね。'
];
// the words said during the blinks (Data.BLINK)
const BLINK_READ = { 'そっと とじて': 'そっと閉じて', 'ぎゅっ': 'ぎゅっ', 'ぱっ！': 'ぱっ！' };
const TIP_READ = [
  '目はいつも、まばたきをして、目のおもてを、きれいにしているよ。1分に20回くらい、まばたきするんだって。',
  '涙には、目をばい菌から守る力があるよ。',
  '猫の目の奥には、光を跳ね返す、鏡のようなところがあるよ。だから、暗くてもよく見えるんだって。',
  'トンボの目は、小さな目が、1万個以上集まって、できているよ。',
  'ワシはとても目がいいよ。高い空から、地面の小さな動物も、見つけられるんだって。',
  'カメレオンは、右と左の目を、別々に動かせるよ。',
  'フクロウは目を動かせないから、首をくるっと回して見るんだよ。',
  'モグラは土の中で暮らすから、目はとても小さいよ。',
  '近くばかり見ていると、目が疲れるよ。時々、遠くを見ようね。',
  '遠くの緑を眺めると、目がほっとするよ。',
  '暗いところで絵本を読むと、目が疲れやすいよ。明るいところで読もうね。',
  '黒目の真ん中の、ひとみは、明るいと小さく、暗いと大きくなるよ。鏡で見てみよう。',
  'まつげは、ほこりやごみが、目に入らないように、守ってくれるよ。',
  'まゆげは、汗が目に入らないように、してくれるよ。',
  '右目と左目は、少し違う場所から見ているよ。だから、ものの遠さがわかるんだって。',
  '片方の目を手で隠して、指を見てみよう。隠す目を変えると、指が動いて見えるよ。',
  'うさぎの目は、顔の横についているから、後ろの方まで見えるよ。',
  'タコやイカにも、目があるよ。とてもよく見えるんだって。',
  'ヘビの仲間には、温かいものを感じる穴を持つものがいるよ。暗くても獲物がわかるんだって。',
  '馬の目はとても大きくて、ほとんどぐるっと、まわりが見えるよ。',
  '目をぎゅっとつぶって、ぱっと開くと、目のまわりの体操になるよ。',
  'テレビやタブレットは、離れて見ようね。近すぎると、目が疲れるよ。',
  '画面をずっと見たら、時々、目を休めようね。',
  '外で遊ぶことは、目にいいと言われているよ。',
  '人の目には、色を見分けるための、3種類のセンサーがあるよ。赤、緑、青だよ。',
  'ミツバチには、人には見えない光が、見えるんだって。',
  '犬は、色の見え方が人と違って、赤と緑が似て見えるんだって。',
  '目の色、黒、茶色、青などは、ひとみのまわりの、こうさいの色だよ。',
  '赤ちゃんは、生まれた時は、あまりよく見えないよ。だんだん見えるようになるんだって。',
  'ボールを最後までよく見ると、上手にキャッチできるよ。',
  '動いているものを、はっきり見る力を、動体視力と言うよ。スポーツで大活躍！',
  '一瞬でたくさんのものを見る力を、瞬間視と言うよ。',
  '前を見たまま、まわりのものに気づく力を、周辺視野と言うよ。',
  '目で見てすぐに、手を動かす力を、目と手の協応と言うよ。',
  '目を素早く動かす力を、眼球運動と言うよ。絵本を読む時にも使うよ。',
  'シマウマのしましまは、たくさん集まると、1頭ずつ見分けにくくなると、言われているよ。',
  '真っ暗な部屋でも、しばらくすると、だんだん見えてくるよ。目が暗さに慣れるんだって。',
  '目は見たものを、脳に送っているよ。ものを見るのは、目と脳のチームプレーなんだ。',
  '夕方暗くなると、色が見分けにくくなるよ。',
  'あくびをすると涙が出るのは、目のまわりが、ぎゅっと動くからだと、言われているよ。',
  '目をこすると、ばい菌が入ることがあるよ。かゆい時は、おうちの人に言おうね。',
  'サングラスは、まぶしい光から、目を守ってくれるよ。',
  '帽子のつばも、まぶしい光から、目を守ってくれるよ。',
  'お日様を、直接見てはいけないよ。目が痛くなってしまうよ。',
  '野菜や魚をしっかり食べると、目の元気にもいいと、言われているよ。',
  '夜しっかり眠ると、目もゆっくり休めるよ。',
  'ハチには、大きな目が2つと、小さな目が3つあるんだって。',
  '目の体操を毎日すると、目を動かすのが上手になるよ。一緒に頑張ろうね！'
];
if (TIP_READ.length !== Data.TIPS.length) throw new Error('TIP_READ needs one reading for each of the ' + Data.TIPS.length + ' facts');
if (STRETCH_READ.length !== Data.STRETCH.length) throw new Error('STRETCH_READ needs one reading for each stretch step');

// ---------------------------------------------------------------- the title and results (app.js)
add(L.morning); add(L.day); add(L.night);
add(L.title[0], '今日も、目の体操しよう！');
add(L.title[1], '毎日少しずつやると、めぢからが、ぐんぐんつくよ。');
add(L.title[2], 'どのトレーニングにする？');
add(L.first, 'はじめまして！ ケロはかせだよ。毎日一緒に、目の体操しようね！');
add(L.checkFirst, 'まずは、今日の目チェックから、やってみる？');
add(L.enough, '今日はたくさん頑張ったね！ 目を休めて、続きはまた明日！');
add(L.newTraining, '新しいトレーニングが、増えたよ！');
add(L.newHard, '「難しい」で、遊べるようになったよ！');
add(L.practiceDone, '上手！ 今度は、本当にやってみよう！');
add(L.tip, '今日の、目の豆知識！');
add(L.record, '新記録！ すごい！');
const COMMON = {
  'すごい！ いままでで いちばんだよ！': 'すごい！ 今までで一番だよ！',
  'じこベスト！ やったね！': '自己ベスト！ やったね！',
  'はじめての きろく だね！': '初めての記録だね！',
  'よく できました！': 'よくできました！',
  'いい ちょうし！': 'いい調子！',
  'がんばったね！': '頑張ったね！',
  'すばらしい！': '素晴らしい！',
  'だいじょうぶ！ ゆっくりで いいよ': '大丈夫！ ゆっくりでいいよ。',
  'つぎは もっと できるよ！': '次はもっとできるよ！',
  'まいにち やると ぐんぐん のびるよ': '毎日やると、ぐんぐん伸びるよ。'
};
[].concat(L.best, L.first1, L.good, L.soso).forEach(t => add(t, COMMON[norm(t)]));
Data.ANIMALS.forEach(a => add(a.name + '！', ANIMAL_READ[a.name] + '！'));
add('スタンプを あつめると あそべるよ', 'スタンプを集めると、遊べるよ。');
add('ケロはかせが しゃべるよ！', 'ケロはかせが、しゃべるよ！');
add('スタンプ ゲット！', 'スタンプ、ゲット！');
add('はなまる スタンプ！', 'はなまるスタンプ！');
['ミミちゃん', 'ニャーちゃん', 'ワンちゃん'].forEach(n => add(n + 'が なかまに なったよ！', n + 'が、仲間になったよ！'));
// training names (new training cards) and how to play them
T.list.forEach(tr => add(tr.name, TRAINING_READ[tr.id]));
T.list.forEach(tr => add(tr.help, HELP_READ[tr.id]));

// ---------------------------------------------------------------- the daily eye check
add('きょうの めチェック！ 5つの テストを するよ', '今日の、目チェック！ 五つのテストをするよ。');
add('きょうは もう チェック したよ。 れんしゅうで やってみよう', '今日はもう、チェックしたよ。練習で、やってみよう。');
Data.CHECK.forEach(c => c.tests.forEach(id => add('よく できました！ つぎは ' + T.byId[id].name, 'よくできました！ 次は、' + TRAINING_READ[id])));
Data.ANIMALS.forEach(a => add('きょうの めは ' + a.name + '！', '今日の目は、' + ANIMAL_READ[a.name] + '！'));
for (let age = 20; age <= 80; age++) add('めねんれいは ' + age + 'さい！', 'め年齢は、' + age + '歳！');
Data.CHECK.forEach(c => add(c.good, CHECK_READ[c.id]));
add('ぜんぶ すごいね！', '全部すごいね！');

// ---------------------------------------------------------------- the eye stretch and the eye facts
Data.STRETCH.forEach((st, i) => add(st[0], STRETCH_READ[i]));
Data.BLINK.forEach(b => add(b[1], BLINK_READ[b[1]]));
Data.TIPS.forEach((t, i) => add(t, TIP_READ[i]));

module.exports = { lines: out, norm: norm };

if (require.main === module) {
  out.forEach(l => console.log(l.text + '  →  ' + l.read));
  console.log(out.length + ' lines');
}
