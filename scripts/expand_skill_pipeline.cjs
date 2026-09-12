'use strict';
// Explicit authoring command. Existing seven skill rows keep their identity and tuning.
const { read, write } = require('./skill_pipeline_csv.cjs');
const skillPath = 'RootDesk/MyDesk/Player/DataSets/SkillDataSet.csv';
const skills = read(skillPath);
const cols = ['JobId','JobName','ManaCost','UnlockQuestId','ProjectileCount','SpreadDegrees','ProjectileSpeed','ProjectileLife','ProjectileSize','PierceCount','SplashSize','SplashMultiplier','AreaSize','AreaReach','Duration','TickInterval','Status','StatusDuration','StatusValue','StatusMaxStacks','ComboStatus','ComboMultiplier','ConsumeCombo','PassiveStat2','PassiveValue2','PassiveItem','HealPerTick'];
skills.headers.push(...cols.filter(c => !skills.headers.includes(c)));
const byId = id => skills.rows.find(r => r.SkillId === id);
function add(base, id, name, values) {
  const row = { ...byId(base), SkillId: id, Name: name, ParentSkillId: '', ParentRequiredLevel: '', UnlockAchievementId: '', UnlockOwnedItem: '', RequireEquippedItem: '', ConsumeItem: '', ConsumeCount: '', PassiveStat:'', PassiveValuePerLevel:'', ...Object.fromEntries(cols.map(c=>[c,''])), ...values };
  const at = skills.rows.findIndex(r => r.SkillId === id); if (at < 0) skills.rows.push(row); else skills.rows[at] = row;
}
add('hand_axe_throw','gigantic_rock','기간틱 락',{Description:'주먹도끼 1개와 MP로 거석을 던집니다. 비행 중 커지며 최대 5마리를 관통하고 밀어냅니다. 끝에서 지진파가 터집니다.',ParentSkillId:'hand_axe_throw',ParentRequiredLevel:3,RequiredLevel:5,TreeRow:3,TreeCol:2,MaxLevel:3,SPCost:2,Cooldown:8,StaminaCost:12,ManaCost:18,DamageMultiplier:2.2,DamagePerLevel:.4,ConsumeItem:'Hand Axe',ConsumeCount:1,RequireEquippedItem:'Hand Axe',ProjectileSpeed:7,ProjectileLife:1.4,ProjectileSize:4,PierceCount:5,SplashSize:7,SplashMultiplier:.8});
add('hand_axe_throw','shatter_scatter','쇄석 흩뿌리기',{Description:'주먹도끼 1개와 MP로 5개의 파편을 부채꼴로 흩뿌립니다. 가까이 붙으면 여러 파편이 같은 적에게 적중합니다.',ParentSkillId:'hand_axe_throw',ParentRequiredLevel:3,RequiredLevel:5,TreeRow:3,TreeCol:3,MaxLevel:3,SPCost:2,Cooldown:5,StaminaCost:10,ManaCost:12,DamageMultiplier:.7,DamagePerLevel:.15,ConsumeItem:'Hand Axe',ConsumeCount:1,RequireEquippedItem:'Hand Axe',ProjectileCount:5,SpreadDegrees:50,ProjectileSpeed:8,ProjectileLife:.65,ProjectileSize:.8});
const job = (id,name,extra) => ({ JobId:id,JobName:name,RequiredLevel:4,MaxLevel:3,SPCost:1,TreeRow:1,TreeCol:2,...extra });
add('power_strike','hunter_trap','사냥꾼의 덫',job('trapper','트래퍼',{Type:'Trap',Description:'앞에 8초 동안 덫을 설치합니다. 처음 밟은 무리를 2초 속박하고 방어력을 20% 낮춥니다. 묶인 적에게 투척 피해가 25% 증가합니다.',Cooldown:10,StaminaCost:8,ManaCost:6,AreaSize:3,AreaReach:2,Duration:8,TickInterval:.25,Status:'Root',StatusDuration:2,StatusValue:.2,DamageMultiplier:.5,DamagePerLevel:.15}));
add('swift_gather','thrifty_hands','알뜰한 손놀림',job('trapper','트래퍼',{Description:'투척 시 탄약을 레벨당 20% 확률로 보존합니다. 마스터하면 100% 보존합니다. 시전할 탄약은 반드시 보유해야 합니다.',MaxLevel:5,TreeRow:1,TreeCol:1,PassiveStat:'AmmoSave',PassiveValuePerLevel:.2}));
add('swift_gather','trophy_eye','전리품 감별안',job('trapper','트래퍼',{Description:'자연 전리품을 레벨당 10% 확률로 1개 더 얻습니다. 덫에 걸린 적은 확률이 두 배가 됩니다.',ParentSkillId:'hunter_trap',ParentRequiredLevel:2,TreeRow:2,TreeCol:2,UnlockQuestId:303,PassiveStat:'LootChance',PassiveValuePerLevel:.1}));
add('power_strike','armor_break','갑주 파쇄타',job('battle_smith','배틀스미스',{Description:'앞의 적을 때려 8초 동안 방어력을 5%씩 깎습니다. 최대 6중첩입니다. 광석을 들고 적중시키면 담금질 피부가 발동합니다.',Cooldown:.9,StaminaCost:6,Status:'ArmorBreak',StatusDuration:8,StatusValue:.05,StatusMaxStacks:6,DamageMultiplier:1.3,DamagePerLevel:.2}));
add('swift_gather','tempered_skin','담금질 피부',job('battle_smith','배틀스미스',{Description:'구리 광석 보유 중 공격 적중 후 6초 동안 받는 피해가 레벨당 2 감소합니다.',TreeRow:1,TreeCol:1,PassiveStat:'DamageReduction',PassiveValuePerLevel:2,PassiveItem:'Copper Ore',Duration:6}));
add('earth_shatter','earth_crusher','대지 분쇄타',job('battle_smith','배틀스미스',{Description:'주변을 강타하고 1.2초 기절시킵니다. 갑주 파쇄 중첩당 피해가 15% 증가하며 중첩을 소모합니다.',ParentSkillId:'armor_break',ParentRequiredLevel:3,TreeRow:2,TreeCol:2,UnlockQuestId:313,Cooldown:9,StaminaCost:18,ManaCost:10,DamageMultiplier:2.8,DamagePerLevel:.5,AreaSize:6,Status:'Stun',StatusDuration:1.2,ComboStatus:'ArmorBreak',ComboMultiplier:.15,ConsumeCombo:'true'}));
add('fireball','acid_potion','슬라임 산성 포션',job('alchemist','알케미스트',{Type:'Field',Description:'앞에 6초 동안 산성 장판을 만듭니다. 1초마다 피해를 주고 이동 속도를 35% 낮춥니다. 푸른 불씨의 촉매가 됩니다.',Cooldown:8,StaminaCost:4,ManaCost:14,AreaSize:4,AreaReach:3,Duration:6,TickInterval:1,Status:'Acid',StatusDuration:2,StatusValue:.35,DamageMultiplier:.45,DamagePerLevel:.1}));
add('swift_gather','mana_affinity','비전 마나 친화',job('alchemist','알케미스트',{Description:'레벨당 최대 MP가 15 증가하고 초당 MP 회복량이 0.5 증가합니다.',TreeRow:1,TreeCol:1,PassiveStat:'MaxMana',PassiveValuePerLevel:15,PassiveStat2:'ManaRegen',PassiveValue2:.5}));
add('fireball','blue_ember','푸른 불씨 폭발',job('alchemist','알케미스트',{Description:'푸른 불씨를 던져 착탄 지점에 폭발을 일으킵니다. 산성에 젖은 적에게 피해가 75% 증가하고 산성 표식을 소모합니다.',ParentSkillId:'acid_potion',ParentRequiredLevel:3,TreeRow:2,TreeCol:2,UnlockQuestId:323,Cooldown:6,StaminaCost:6,ManaCost:18,DamageMultiplier:2,DamagePerLevel:.4,ProjectileSpeed:9,SplashSize:5,SplashMultiplier:1,ComboStatus:'Acid',ComboMultiplier:.75,ConsumeCombo:'true'}));
add('power_strike','wild_whistle','야생의 호루라기',job('wild_keeper','와일드키퍼',{Type:'Projectile',Description:'멧돼지 정령이 앞으로 돌진하며 최대 4마리를 밀어내고 1초 넘어뜨립니다. 회복할 틈을 만듭니다.',Cooldown:8,StaminaCost:8,ManaCost:10,ProjectileRUID:'a11cef0c68bf47149f2f5703a04926fd',ProjectileSize:2,ProjectileSpeed:10,ProjectileLife:.8,PierceCount:4,Status:'Stun',StatusDuration:1,DamageMultiplier:1.8,DamagePerLevel:.35}));
add('power_strike','thorn_guard','가시 넝쿨 방벽',job('wild_keeper','와일드키퍼',{Type:'Guard',Description:'6초 동안 피해를 30% 줄이고 가까운 공격자에게 받은 피해의 60%를 되돌립니다. 레벨당 반사율이 10% 증가합니다.',TreeRow:1,TreeCol:1,Cooldown:12,StaminaCost:6,ManaCost:12,Duration:6,StatusValue:.3,DamageMultiplier:.6,DamagePerLevel:.1}));
add('swift_gather','nature_vitality','자연의 활력',job('wild_keeper','와일드키퍼',{Type:'HealAura',Description:'6초 동안 주변 아군을 초당 4+레벨×2 회복합니다. 배운 뒤 가축에게 먹이를 주면 친밀도가 더 오르고 생산 대기가 레벨당 10% 짧아집니다.',ParentSkillId:'wild_whistle',ParentRequiredLevel:3,TreeRow:2,TreeCol:2,UnlockQuestId:333,Cooldown:18,StaminaCost:6,ManaCost:20,Duration:6,TickInterval:1,AreaSize:6,AreaReach:0,HealPerTick:4,PassiveStat:'AnimalCare',PassiveValuePerLevel:.1,EffectRUID:'86500681cfad4e8488cf4ba9376fe801',EffectScale:2}));
write(skillPath,skills);
const qp='RootDesk/MyDesk/QuestAndAchievement/DataSets/QuestDataSet.csv', cp='RootDesk/MyDesk/QuestAndAchievement/DataSets/QuestConditionDataSet.csv';
const quests=read(qp), conditions=read(cp);
for(const c of ['RequiredLevel','RequiredJobId','RewardJobId','RewardSP']) if(!quests.headers.includes(c)) quests.headers.push(c);
const jobs=[
 {base:301,id:'trapper',name:'트래퍼',npc:'vendor',basic:['풀로 엮는 사냥 준비','Gather','Grass',10],test:['멧돼지의 빈틈','Kill','boar',3],root:'hunter_trap',bonus:'Hand Axe:20'},
 {base:311,id:'battle_smith',name:'배틀스미스',npc:'blacksmith',basic:['모루를 달굴 땔감','Gather','Wood',10],test:['단단함을 이해하는 시험','Gather','Copper Ore',5],root:'armor_break',bonus:'Copper Ore:5'},
 {base:321,id:'alchemist',name:'알케미스트',npc:'researcher',basic:['촉매가 될 표본','Gather','Slime Jelly',3],test:['움직이는 표본의 비밀','Kill','slime',5],root:'acid_potion',bonus:'Slime Jelly:3'},
 {base:331,id:'wild_keeper',name:'와일드키퍼',npc:'barnkeeper',basic:['헛간의 겨울 준비','Gather','Grass',10],test:['사나워진 숲의 친구','Kill','boar',3],root:'wild_whistle',bonus:'Chicken Ticket:1|Carrot Seed:5'}
];
for(const j of jobs) {
 for(let phase=0;phase<3;phase++) {
  const id=String(j.base+phase), task=phase===0?j.basic:j.test;
  const row={...Object.fromEntries(quests.headers.map(h=>[h,''])),Id:id,Name:phase===2?j.name+' 실전 수련':task[0],Desc:phase===0?j.name+'의 기초를 익혀 보세요.':phase===1?j.name+' 전직 시험입니다. 보고하면 이 직업으로 확정됩니다. 다른 직업으로 바꿀 수 없습니다.':'첫 전투 기술을 배우고 실전에서 익혀 보세요. 보고하면 다음 스킬을 배울 수 있습니다.',ProgressingDesc:phase===2?'기술을 익힌 뒤 사냥하고 멘토에게 보고하세요.':task[0]+'을 마치고 멘토에게 보고하세요.',CategoryEnum:'Sub',CycleEnum:'None',LinkedPrevId:phase===0?'107':String(j.base+phase-1),GiverNpcId:j.npc,TurnInNpcId:j.npc,Priority:id,RequiredLevel:phase===0?2:4,RequiredJobId:phase===0?'':phase===1?'novice':j.id,RewardJobId:phase===1?j.id:'',RewardSP:phase===1?5:phase===2?3:1,RewardItems:phase===1?j.bonus:'',ConsumeItems:phase===0?task[2]+':'+task[3]:''};
  const at=quests.rows.findIndex(r=>r.Id===id); if(at<0)quests.rows.push(row);else quests.rows[at]=row;
  conditions.rows=conditions.rows.filter(r=>r.Id!==id);
  if(phase===2){conditions.rows.push({Id:id,Description:'첫 전투 기술 배우기',CondEnum:'LearnSkill',CondArg:j.root,Value:1,CountMode:'State'});conditions.rows.push({Id:id,Description:'실전 퇴치',CondEnum:'Kill',CondArg:'slime',Value:5,CountMode:'Action'});}
  else conditions.rows.push({Id:id,Description:task[0],CondEnum:task[1],CondArg:task[2],Value:task[3],CountMode:'Action'});
 }
}
write(qp,quests);write(cp,conditions);
const dp='RootDesk/MyDesk/MapObjects/DataSets/ItemDropDataSet.csv', drops=read(dp);
if(!drops.headers.includes('NaturalLoot'))drops.headers.push('NaturalLoot');
for(const r of drops.rows)if(['raw_meat','slime_jelly'].includes(r.ItemId))r.NaturalLoot='true';
write(dp,drops);
const dialogs=read('RootDesk/MyDesk/NPC/DataSets/DialogDataSet.csv');
for(const j of jobs){const t=j.name+' 수련을 원하면 기초 과제부터 해 봐. 전직 시험 보고는 한 직업만 선택할 수 있어.';if(!dialogs.rows.some(r=>r.Text===t))dialogs.rows.push({NpcId:j.npc,Text:t,TimeBand:'any',Weight:100});}
write('RootDesk/MyDesk/NPC/DataSets/DialogDataSet.csv',dialogs);
console.log('Authored '+skills.rows.length+' skills and 12 mentor quests.');
