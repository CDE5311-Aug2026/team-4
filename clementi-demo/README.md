# 楼下 Downstairs 金文泰

基于用户更新的两份企划与《game improve》反馈制作的金文泰单案例浏览器游戏。沿用 Downstairs 的全屏夕阳社区、像素人物、深蓝金色界面和清晰文字。

当前是社区生活版。仅金文泰可玩，榜鹅与芽笼可浏览简介和工程概念牌。下载并打开 Clementi-Living-Neighbourhood.html 即可离线游玩。

## 这版怎样玩

先在新加坡地图选择金文泰。简介按历史、现况、现实挑战介绍金文泰规划区，并注明统计范围与来源。八户虚构邻居有独立页签。进入社区后，可以跳过教程或先练习观察、出牌和放置。

公共事件提示从地图上的发生位置弹出。邮箱收取居民主动告诉你的私人需求。打开新问题时，推荐牌会从弹窗飞入手牌。也可以从牌库挑牌加入手牌。建设牌从手牌直接进入选址，其他行动确认后执行。

牌库有 37 张牌，其中 33 张可以在金文泰按条件使用，4 张是其他案例的概念预览。城镇工程包括食阁扩建、商场入口改造和地铁换乘接驳。可以按类别、目标、关键词和当前可用状态寻找。预算、居民信任、人手、用地和工期分别计算。

地图和地点列表用相同编号标出可用位置。选中后可预览占地。部分设施可以微调位置和旋转，坡道沿既有路缘布置。工程完成后关闭反馈，在设施上方播放一次烟花。

拖动地图旋转，Shift 加拖动或右键拖动平移，滚轮缩放，双击空地或按 Home 重置。触屏可用单指旋转、双指缩放和平移。右上角的「用地」开关显示地块状态。

行动开始、完成、调解、咨询和后续回应有相应情境演出与资源变化提示。社区记录可回看反馈，回看不重复扣费或加分。人物走动、施工人员工作、车辆与邻里交流随经营时间推进。阅读、教程、牌库、互动演出与选址时自动暂停；暂停原因保持可见。1×／2×／3×改变经营速度。

三个目标分别为住得下、处得来、住得舒服。互动 Rulebook 会演示相关措施，并提供不扣正式资源的小练习。精确通关与危险条件可展开查看。

## 研究与虚构内容

人口概览使用 [SingStat 地理分布资料](https://www.singstat.gov.sg/find-data/explore-data-themes/population/geographic-distribution/latest-news-data)所列的 June 2026 单岁年龄、性别与分区 CSV。汇总 Clementi Planning Area 的 9 个互斥分区、男女与 91 个年龄单元；共 1,638 个源单元格。源数据每格取整到 10 人，因此合计约 104,830 人、65 岁以上约 21.8% 是按已取整单元格汇总的概数。范围为 URA Master Plan 2025 金文泰规划区，并非示意街区。

Resident population 仅包括公民和永久居民，外籍非永久居民不在此分母中。八户人物不是按比例抽样；姓名、精确年龄、职业、家庭关系与故事为虚构设定。人物卡区分地区统计背景与叙事设定，不把个体经历包装为访谈发现。

历史与设施背景参考 [SG101 Clementi](https://www.sg101.gov.sg/resources/archives/clementi/)。地图轮廓采用 [Natural Earth](https://www.naturalearthdata.com/about/) 公开地理数据；道路、楼栋、可用空间与设施位置均为游戏示意，不是逐栋复刻或真实可开发地块调查。

政策牌附官方来源。EASE 只改善住宅内及入口，不替代屋外遮蔽；普通 AAC 不等于日间照护；EIP 仅模拟协助与受理，不保证豁免或成交。预算、工期、人手、支持率与效果数值是试玩设定。

## 本地运行与离线文件

运行 `node server.cjs`，打开终端打印的地址。`PORT` 可指定其他端口。

重建 3D：`node scripts/build-scene.cjs`。已包含 Three.js 本地源码，不需要安装依赖或联网构建。

重建离线文件：`node package-offline.cjs`，生成 `Clementi-Living-Neighbourhood.html`。上一版可以从 [原 GitHub 分支](https://github.com/CDE5311-Aug2026/team-4/tree/codex/clementi-interaction-upgrade-2026-11-03/clementi-demo) 下载。

重新提取官方人口数据：`node scripts/fetch-community.cjs`。更新行动牌或地块双语字段后：`node scripts/update-translations.cjs`。

## 检查

机制：`node tests/engine-upgrade.cjs`，覆盖自由行动、渠道、存档迁移、选址、资源与投票，并运行原经营回归。

场景：`node tests/scene-upgrade.cjs`，以实际 Three.js 几何核对建筑立面、预览、工人与社交动作、暂停，以及 600 秒和大幅时间跳转的车辆形体分离。

开局与研究：`node tests/community-check.cjs`，核对数据汇总、双语人物、历史／设施／挑战与年龄图互动，以及仅金文泰可进入。

界面：`node tests/ui-upgrade.cjs`，核对自由牌库、消息分流、反馈回看、选址与暂停。翻译：`node tests/translation-upgrade.cjs`。资源：`node tests/assets-check.cjs`。

浏览器检查结果在交付时单独说明。几何分离检查不等于完整交通物理模拟；车流采用预设路线、独立车道和固定间距。演出为简化像素情境，不模拟真实个体的全天生活。

## 源码

`dist/data.js` 人物、卡牌和地块；`engine.js` 经营与故事；`app.js` 交互和反馈；`visuals.js` 像素情境；`experience.css` 新界面；`community.js` 人口和人物依据；`flow.js` 开局；`i18n.js` 双语；`scene-adapter.js` 状态连接；`scene-source.mjs` 三维源文件；`dist/scene.bundle.js` 离线场景包。`world.js` 为二维兼容地图。
