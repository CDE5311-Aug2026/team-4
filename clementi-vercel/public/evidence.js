(function(root){
  'use strict';
  const pair=(zh,en)=>({zh,en});
  const source=(zh,en,url)=>({label:pair(zh,en),url});
  // Public context and policy references approved in the 2026-11-11 text review.
  // Characters, incidents, map layout and game rules are authored simulations.
  root.CM_EVIDENCE={
    title:pair('内容从哪里来','Where the content comes from'),
    intro:pair('想知道一个人物的生活细节、一张政策卡，或金文泰的背景介绍参考了什么？这里把内容和出处放在一起，方便继续了解。历史、人口和政策参考公开资料；居民姓名、家庭经历与具体事件由团队创作。七年任期、玩家权限、资金、人手和得分，也都是为了体验而设计的规则。','Curious about a character’s everyday life, a policy card or Clementi’s background? Here you can find the references behind the content. History, population figures and policies draw on public sources. Residents, family stories and specific incidents are fictional. The seven-year term, player powers, funds, staff and scores are game rules created for the experience.'),
    footer:pair('资料核对：2026年11月。政策和建设计划可能更新，点击来源可查看官方说明。','References checked in November 2026. Policies and development plans may change; follow the links for official information.'),
    groups:[
      {
        id:'clementi-background',
        title:pair('金文泰，怎样成为今天的金文泰','How Clementi became the town it is today'),
        mapping:pair('开局的历史、人口与住宅背景','Opening: history, population and housing context'),
        body:pair('成镇历史参考SG101；人口与年龄资料来自SingStat。统计描述相应年份的整个规划区，游戏中的几户居民并不代表全部金文泰居民。市场与熟食中心的位置参考NEA名录。','The town’s history draws on SG101, while population and age figures come from SingStat. These statistics describe the whole planning area in the stated year; the game’s households do not represent all Clementi residents. Market and food-centre locations refer to NEA’s directory.'),
        sources:[
          source('金文泰的发展历史 · SG101','Clementi’s history · SG101','https://www.sg101.gov.sg/resources/archives/clementi/'),
          source('地区人口与原始资料 · SingStat','Area population and source data · SingStat','https://www.singstat.gov.sg/find-data/explore-data-themes/population/geographic-distribution/latest-news-data'),
          source('全国人口年龄结构 · SingStat','National age profile · SingStat','https://www.singstat.gov.sg/publication-resources/population-trends-2026'),
          source('市场与熟食中心名录 · NEA','Market and food-centre directory · NEA','https://www.nea.gov.sg/docs/default-source/hawker-centres-documents/list-of-hcs_19-mar-2025.pdf')
        ]
      },
      {
        id:'clementi-renewal',
        title:pair('这座成熟市镇，仍在发生变化','A mature town that keeps changing'),
        mapping:pair('开局的新增住宅、公共设施与适老更新','Opening: new housing, public facilities and senior-friendly upgrading'),
        body:pair('Clementi NorthArc、新推出的Clementi Emerald、综合诊疗所重建、适老更新及跨岛线工程，让我们能用具体项目说明金文泰目前的变化。已完成、建设中和规划中的项目，在介绍中分别说明。诊疗所时间采用MOH于2026年公布的2030年前重建安排。','Clementi NorthArc, the newly launched Clementi Emerald, polyclinic redevelopment, senior-friendly upgrading and Cross Island Line works provide concrete examples of change. The introduction distinguishes completed projects, works under construction and plans. The polyclinic timeline follows MOH’s 2026 update: redevelopment by 2030.'),
        sources:[
          source('已完成的Clementi NorthArc · HDB','Completed Clementi NorthArc · HDB','https://www.hdb.gov.sg/-/media/hdb-pulse/news/2025/whampoa-park-bags-hdbs-inaugural-landscape-award/20250919-Annex.pdf'),
          source('Clementi Emerald项目资料 · HDB','Clementi Emerald project information · HDB','https://assets.hdb.gov.sg/residential/buying-a-flat/finding-a-flat/sales-brochure/25JULBTO_pdf_selection/clementi_emerald.pdf'),
          source('金文泰诊疗所重建背景 · MOH','Clementi Polyclinic redevelopment background · MOH','https://www.moh.gov.sg/newsroom/clementi-polyclinic-to-be-redeveloped-at-new-site-by-2027-new-polyclinic-in-taman-jurong-area-by-2028_1jun2022/'),
          source('诊疗所重建的最新时间安排 · MOH','Updated polyclinic redevelopment timeline · MOH','https://www.moh.gov.sg/newsroom/enhancing-quality-and-coordination-of-care/'),
          source('适老更新扩展至金文泰 · HDB','Senior-friendly upgrading extends to Clementi · HDB','https://www.hdb.gov.sg/hdb-pulse/news/2026/close-to-29000-hdb-households-to-benefit-from-upgrading-projects-to-enhance-their-neighbourhoods'),
          source('跨岛线第二阶段工程 · LTA','Cross Island Line Phase 2 works · LTA','https://www.lta.gov.sg/content/ltagov/en/newsroom/2025/7/news-releases/construction_begins_on_crl2.html')
        ]
      },
      {
        id:'residents-and-memory',
        title:pair('居民的故事，和家里的小东西','Residents’ stories and the things in their homes'),
        mapping:pair('邻居背景、屋内物件与社区记忆','Neighbour profiles, household objects and community memories'),
        body:pair('人物的姓名、年龄、职业、家庭关系和对白由团队创作。丽的呼声、组屋底层公共空间等生活细节参考历史文化资料；这些资料提供生活背景，人物不对应真实受访者。','Names, ages, occupations, family relationships and dialogue are fictional. Details such as Rediffusion and the everyday use of HDB void decks draw on cultural and historical sources. These provide context; the characters do not portray real interview participants.'),
        sources:[
          source('丽的呼声的黄金年代 · NLB','The golden years of Rediffusion · NLB','https://biblioasia.nlb.gov.sg/files/pdf/vol-15/v15-issue4_Rediffusion.pdf'),
          source('组屋底层的生活 · NHB','Life in HDB void decks · NHB','https://www.nhb.gov.sg/~/media/nhb/files/resources/publications/ebooks/nhb_ebook_void_decks.pdf')
        ]
      },
      {
        id:'game-goals',
        title:pair('三个目标，为什么这样设计','Why the game has these three goals'),
        mapping:pair('「住得下、处得来、住得舒服」','The game’s housing, community and living-environment goals'),
        body:pair('HDB的工作关注可负担、优质住房，以及支持社区生活的居住环境。我们把这些关注转成三个便于理解的游戏目标。它们是团队的概括；70分目标和卡牌加减分属于游戏设定，并非HDB的官方指标。','HDB’s work concerns affordable, quality housing and living environments that support communities. We adapted these concerns into three accessible game goals. This is the team’s interpretation: the 70-point target and card effects are game rules, not official HDB indicators.'),
        sources:[source('HDB的使命与工作 · HDB','HDB’s mission and work · HDB','https://www.hdb.gov.sg/about-us/our-story')]
      },
      {
        id:'accessible-homes',
        title:pair('从家门口，走到社区里','From the front door into the neighbourhood'),
        mapping:pair('第一年：屋内安全、入口和公共通路','Year 1: safety at home, entrances and public routes'),
        body:pair('屋内防滑、扶手等改善参考EASE；公共通路、坡道和连接设施参考HDB的通用设计。不同措施处理不同地点的困难，各有适用范围。','Home improvements such as slip-resistant treatments and grab bars draw on EASE. Public paths, ramps and connections refer to HDB’s universal design approach. Different measures address barriers in different places and have their own scope.'),
        sources:[
          source('EASE适老化改善 · HDB','Enhancement for Active Seniors (EASE) · HDB','https://www.hdb.gov.sg/managing-my-home/upgrading-and-redevelopment/enhancement-for-active-seniors-ease'),
          source('通用设计 · HDB','Universal design · HDB','https://www.hdb.gov.sg/about-us/our-role/plan-and-design-towns/universal-design')
        ]
      },
      {
        id:'housing-life-stages',
        title:pair('一套房子，怎样适应不同人生阶段','Housing for different stages of life'),
        mapping:pair('第二年：买房准备、退休住房与照护选择','Year 2: preparing to buy, retirement housing and care options'),
        body:pair('相关情节参考HFE、屋契回购计划、乐龄安居花红和社区关爱组屋，让住房选择与家庭生活联系起来。真实申请的资格与安排见官方说明，卡牌资金不代表住户需要缴纳的官方费用。','These stories refer to HFE, the Lease Buyback Scheme, Silver Housing Bonus and Community Care Apartments, connecting housing choices with family life. Official sources explain actual eligibility and arrangements. Card costs do not represent official fees paid by residents.'),
        sources:[
          source('HFE申请与资格评估 · HDB','HFE application and eligibility assessment · HDB','https://www.hdb.gov.sg/buying-a-flat/flat-grant-and-loan-eligibility/application-for-an-hdb-flat-eligibility-hfe-letter'),
          source('屋契回购计划 · HDB','Lease Buyback Scheme · HDB','https://www.hdb.gov.sg/managing-my-home/retirement-planning/monetising-flat-for-retirement/lease-buyback-scheme-lbs/understanding-the-lbs'),
          source('乐龄安居花红 · HDB','Silver Housing Bonus · HDB','https://www.hdb.gov.sg/managing-my-home/retirement-planning/monetising-flat-for-retirement/silver-housing-bonus'),
          source('社区关爱组屋 · HDB','Community Care Apartments · HDB','https://www.hdb.gov.sg/buying-a-flat/bto-sbf-and-open-booking-of-flats/finding-a-new-flat/types-of-flats/community-care-apartments')
        ]
      },
      {
        id:'ethnic-integration',
        title:pair('共同生活的目标，怎样影响个别家庭','How shared goals affect individual households'),
        mapping:pair('第三年：族群共居、售房限制与家庭处境','Year 3: ethnic integration, resale limits and household circumstances'),
        body:pair('故事参考族群融合政策（EIP）的目的，以及对符合条件、确实遇到售房困难者的援助安排。家庭经历为虚构，获得协助也不代表一定获批或自动豁免政策要求。','The story draws on the purpose of the Ethnic Integration Policy (EIP) and assistance for eligible sellers facing genuine difficulties. The family’s experience is fictional. Receiving assistance does not guarantee approval or an automatic exemption from policy requirements.'),
        sources:[
          source('了解族群融合政策 · gov.sg','Understanding the Ethnic Integration Policy · gov.sg','https://www.gov.sg/explainers/hdb-ethnic-integration-policy/'),
          source('政策与援助安排的背景 · HDB','Background on the policy and assistance · HDB','https://assets.hdb.gov.sg/about-us/news-and-publications/annual-report/2022/building-homes.html')
        ]
      },
      {
        id:'neighbourhood-renewal',
        title:pair('旧社区更新，为什么需要一起商量','Why neighbourhood renewal needs discussion'),
        mapping:pair('第四年：公共空间、设施更新与居民参与','Year 4: shared space, facility renewal and resident participation'),
        body:pair('相关情节参考邻区更新计划（NRP）和居民参与社区项目的做法。具体场地和分歧由团队编写，选牌过程是对讨论的简化表达；真实项目另有咨询、支持率要求和审批程序。','These situations refer to the Neighbourhood Renewal Programme (NRP) and community participatory projects. Sites and disagreements are fictional. Choosing a card simplifies the discussion; real projects have their own consultation, support requirements and approval processes.'),
        sources:[
          source('邻区更新计划 · HDB','Neighbourhood Renewal Programme · HDB','https://www.hdb.gov.sg/managing-my-home/upgrading-and-redevelopment/neighbourhood-renewal-programme-nrp'),
          source('居民参与的社区项目 · HDB','Community participatory projects · HDB','https://www.hdb.gov.sg/managing-my-home/living-in-my-community/enlivening-my-neighbourhood/community-participatory-projects')
        ]
      },
      {
        id:'community-care',
        title:pair('有人陪伴，也需要合适的照护','Companionship and appropriate care'),
        mapping:pair('长者联系、邻里互助、服务转介与照护压力','Senior connections, mutual support, referrals and caregiving pressure'),
        body:pair('这些情节参考活跃乐龄中心与社区照护服务。邻里联系能提供陪伴、帮助发现需要；专业照护则需要相应的服务与评估。','These stories refer to Active Ageing Centres and community care services. Neighbourly connections can provide companionship and help identify needs. Professional care requires the appropriate services and assessment.'),
        sources:[
          source('活跃乐龄中心 · AIC','Active Ageing Centres · AIC','https://www.aic.sg/Care-Services/Active-Ageing-Centres'),
          source('社区照护服务 · MOH','Community care services · MOH','https://www.moh.gov.sg/ageing-well/care-services/')
        ]
      },
      {
        id:'cooler-neighbourhoods',
        title:pair('天气更热，居住环境可以怎样改变','How living environments can respond to heat'),
        mapping:pair('第五年：遮阴、绿化与降温措施','Year 5: shade, greenery and cooling measures'),
        body:pair('内容参考HDB绿色市镇计划、亲生物设计和隔热涂料措施。措施的实际作用与位置、设计和使用条件有关；地图中的热区和加减分是模拟，并非金文泰的实测结果。','The content refers to HDB’s Green Towns Programme, biophilic design and cool coatings. Actual effects depend on location, design and use. The game’s heat zones and score changes are simulations, not measurements taken in Clementi.'),
        sources:[
          source('绿色市镇计划 · HDB','Green Towns Programme · HDB','https://www.hdb.gov.sg/about-us/our-role/create-smart-and-sustainable-homes/green-towns-programme'),
          source('隔热涂料措施 · HDB','Cool coatings initiative · HDB','https://www.hdb.gov.sg/hdb-pulse/news/2025/hdb-to-extend-cool-coatings-initiative-to-all-existing-hdb-estates'),
          source('亲生物市镇设计 · HDB','Biophilic towns · HDB','https://www.hdb.gov.sg/sitecore/content/hdbinfoweb/home/about-us/our-role/create-smart-and-sustainable-homes/biophilic-towns')
        ]
      },
      {
        id:'public-resource-systems',
        title:pair('太阳能、雨水与回收，怎样改变公共系统','Solar energy, rainwater and recycling in public systems'),
        mapping:pair('第六年：能源、用水、资源回收与绿色出行','Year 6: energy, water, resource recovery and green mobility'),
        body:pair('相关内容参考公共设施太阳能、雨水收集、节能照明和绿色出行措施；旧电器回收参考NEA资料。这些措施有不同的服务范围，例如公共设施节能并不等同于每户电费都会下降。','The content refers to solar energy for common services, rainwater harvesting, energy-efficient lighting and green mobility. E-waste recycling draws on NEA guidance. Each measure has its own scope: saving energy in common services does not mean every household’s electricity bill will fall.'),
        sources:[
          source('绿色市镇措施说明 · HDB','Green Towns measures explained · HDB','https://www.hdb.gov.sg/-/media/hdb-pulse/news/2025/hdb-to-extend-cool-coatings-initiative-to-all-existing-hdb-estates/03022025-Annex.pdf'),
          source('绿色创新 · HDB','Green innovations · HDB','https://www.hdb.gov.sg/about-us/our-role/create-smart-and-sustainable-homes/green-innovations'),
          source('地下雨水收集系统 · HDB','Underground rainwater harvesting · HDB','https://www.hdb.gov.sg/hdb-pulse/news/2022/greener-more-sustainable-homes'),
          source('电子废弃物与回收 · NEA','E-waste management and recycling · NEA','https://www.nea.gov.sg/our-services/waste-management/3r-programmes-and-resources/e-waste-management')
        ]
      },
      {
        id:'housing-and-nature',
        title:pair('新住房与已有的自然，怎样一起考虑','Considering new homes alongside existing nature'),
        mapping:pair('开局的生态背景；第七年的土地、住房与环境规划','Opening ecology context; Year 7 land, housing and environmental planning'),
        body:pair('金文泰自然廊道说明当地林地之间的生态联系；Sunset Way／Maju Forest的规划调整，提供了结合住房需要、环境研究与公众反馈的现实例子。游戏中的候选地、方案和结果均为虚构，参考的是这些规划议题。','The Clementi Nature Corridor explains ecological connections between nearby wooded areas. Revised plans for Sunset Way / Maju Forest offer a real example of considering housing needs, environmental studies and public feedback together. The game’s sites, options and outcomes are fictional; these planning questions provide the reference.'),
        sources:[
          source('金文泰自然廊道 · NParks','Clementi Nature Corridor · NParks','https://www.nparks.gov.sg/news/news-detail/nparks-announces-new-clementi-nature-corridor'),
          source('把环境纳入市镇规划 · HDB','Planning with the environment in mind · HDB','https://www.hdb.gov.sg/about-us/our-role/plan-and-design-towns/planning-with-the-environment-in-mind'),
          source('Sunset Way／Maju Forest修订规划 · HDB','Revised Sunset Way / Maju Forest plans · HDB','https://www.hdb.gov.sg/hdb-pulse/news/2026/revised-plans-for-sunset-way-and-gillman-barracks-to-integrate-new-homes-with-more-greenery'),
          source('环境研究资料 · URA','Environmental studies · URA','https://www.ura.gov.sg/land-planning/planning-strategies/greenery-and-heritage/environmental-impact-assessment/')
        ]
      },
      {
        id:'incidents-further-reading',
        title:pair('突发事件之外，还可以了解什么','Further reading beyond the fictional incidents'),
        mapping:pair('火灾、天气影响、诈骗和邻里纠纷的延伸阅读','Further reading on fires, weather impacts, scams and neighbour disputes'),
        body:pair('这些具体事件由团队创作，出现次数不代表金文泰的实际发生率。下面是现实中的安全与求助资料，供继续了解；游戏选项与扣分不能代替实际处置指引。','The specific incidents are fictional; their frequency does not reflect actual incident rates in Clementi. The links provide real safety and support information for further reading. In-game choices and penalties do not replace real-world response guidance.'),
        sources:[
          source('居家消防安全 · SCDF','Home fire safety · SCDF','https://www.scdf.gov.sg/home/community-and-volunteers/community-resources/home-fire-safety-checker'),
          source('洪水安全 · PUB','Flood safety · PUB','https://www.pub.gov.sg/Public/KeyInitiatives/Get-Flood-Wise/Flood-Safety-Tips'),
          source('烟霾与健康 · MOH','Haze and health · MOH','https://www.moh.gov.sg/others/haze/'),
          source('防范诈骗 · ScamShield','Scam prevention · ScamShield','https://www.scamshield.gov.sg/about-scamshield/what-is-scamshield/'),
          source('社区调解 · CMC','Community mediation · CMC','https://cmc.mlaw.gov.sg/our-service/faqs/')
        ]
      },
      {
        id:'maps-and-presentation',
        title:pair('地图与画面，哪些来自现实','What in the map and visuals comes from reality'),
        mapping:pair('开局定位地图与游戏内街区','Opening location map and the in-game neighbourhood'),
        body:pair('新加坡定位地图的轮廓使用Natural Earth公共领域数据。游戏内街区的建筑布置、道路、人物位置和实施动画经过设计，不是金文泰的精确测绘。若启用AI对话，它用于角色表达，资料依据仍以这里列出的来源为准。','The Singapore location outline uses Natural Earth public-domain data. The in-game buildings, roads, character positions and implementation animations are designed scenes, not a precise survey of Clementi. Optional AI dialogue supports character expression; factual references remain the sources listed here.'),
        sources:[source('地图轮廓数据 · Natural Earth','Map outline data · Natural Earth','https://www.naturalearthdata.com/about/')]
      }
    ]
  };
})(typeof window!=='undefined'?window:globalThis);
