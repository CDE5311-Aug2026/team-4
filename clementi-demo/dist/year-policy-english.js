/* English for the approved seven-year policy narrative. Authored translations only.
 * The exact Chinese keys are taken from year-policy-content.js at load time.
 * This file does not change game rules, values, UI or the original translation table. */
(function (root) {
  'use strict';
  const option = (a) => ({ name: a[0], description: a[1], result: a[2] });
  const options = (a, b, c) => ({ community: option(a), service: option(b), capital: option(c) });
  const years = [];
  years[1] = {
    title: 'From home to the hawker centre: which part of the journey is accessible?',
    story: 'In your first week, several seemingly small matters reach you: an umbrella, a pushchair and a doorstep. Visiting residents reveals the daily journey connecting them: getting up indoors, leaving home and reaching a destination. Different people get stopped at different points.',
    closing: 'This year, you learned to ask where a difficulty occurs: inside a flat, at its entrance or along a public route. One facility can help different people, but fixing one spot may not connect the whole journey.\n\nNext year, Rahman places some housing information on the table: “Getting around matters, but we are also wondering what kind of home we can afford and live well in as we grow older.”',
    cases: {
      chen: {
        title: 'Steady at home, but still waiting for the rain to stop',
        scene: 'An umbrella drips by the door. Chen Yuying rests her walking stick beside a chair, invites you to sit and points to the breakfast on the table.',
        opening: 'My daughter cleared the clutter last time she visited, so there is more room indoors. But today I still had to wait for the rain to stop before that stretch to the hawker centre. Home and the journey outside give me different difficulties.',
        questions: [
          { question: 'What is difficult indoors, and what is difficult outside?', reply: 'When I turn in the bathroom, I want something steady to hold. Outside, I can walk that stretch, but holding an umbrella and a stick together is hard. Installing one thing will not fix both.' },
          { question: 'What if someone brings breakfast to you first?', reply: 'Help during a sudden downpour is welcome. But I still want to meet my friends there. Bringing things to my door does not mean I no longer need to go out.' }
        ],
        need: 'I want to move around more safely at home and keep going out independently. Please look separately at safety indoors and that stretch outside.',
        options: options(
          ['Bridge the immediate journey', 'Ask what temporary help she is willing to accept, and explain how home improvements and public-route issues can each be raised.', 'Chen has an interim arrangement and knows where the different problems belong. Installation indoors and work outside still need to happen.'],
          ['Arrange targeted home improvements', 'Check the flat and her needs, then address suitable safety measures such as grab bars and slip resistance. This does not provide a sheltered route outdoors.', 'Key places at home become easier to use. The exposed stretch to the hawker centre still needs a separate response.'],
          ['Connect the public sheltered route', 'Direct this public investment to the identified exposed link, with arrangements for access during construction.', 'Rainy-day travel improves for Chen and others using the route. Her safety needs inside the flat still require separate attention.']
        )
      },
      lin: {
        title: 'A sheltered route must also work for a pushchair',
        scene: 'The four-year-old waits for shoes by the door while the one-year-old sits in a pushchair. Zhou Jiaying asks you to make room so she can turn it through the entrance.',
        opening: 'We take the same route as Auntie Chen. She thinks first about rain; we look for somewhere the pushchair can pass. If one end is level but the next has a high kerb, we still have to lift it when we get there.',
        questions: [
          { question: 'What would make an accessible route genuinely work for you?', reply: 'It must connect all the way from the block, through the crossing, to the hawker centre entrance. Drawing a line on a map is not enough. Push the buggy along it and the breaks become obvious.' },
          { question: 'Who else might benefit from a pushchair-friendly route?', reply: 'People using walking aids or recovering from an injury might use it too. We do not need a route reserved for us. We want different people to pass through smoothly.' }
        ],
        need: 'We want a genuinely continuous connection from home to everyday facilities, without having to search for another way out halfway through.',
        options: options(
          ['Keep the existing route clear', 'Work with users to remove movable obstructions and explain the routes already available.', 'Some immediate obstructions are removed. Thresholds, changes in level and missing connections still need physical improvements.'],
          ['Fix a key connecting obstacle', 'Check the entrances and links used by the pushchair, and improve the specific level changes and access issues this action can address.', 'The pushchair passes this entrance more easily. The parents no longer have to stop here and search for another route.'],
          ['Complete a continuous accessible link', 'Consider the residential exit, public path and facility entrance together, preserving necessary width and other uses.', 'The connection to the hawker centre becomes more continuous, benefiting pushchairs and people using mobility aids.']
        )
      },
      rahman: {
        title: 'The shortest route is not always the one people can use',
        dialogue: [
          'There is a shortcut to the station, but it has stairs. We used to think nothing of it. With sore knees, we now take the longer way.',
          'What kinds of use should the route accommodate?',
          'Some people hurry; others need level ground and somewhere to pause. Do not only measure the shortest line. Consider who might stop going out because of it.'
        ],
        need: 'We want practical route choices to transport facilities, so walking slowly does not force us to give up everyday journeys.',
        options: options(
          ['Explain the available gentler route', 'Show the existing alternative route and places to rest.', 'The couple know how to go around. The longer journey remains.'],
          ['Improve the main walking connection', 'Check commonly used entrances, surfaces and wayfinding, addressing identified difficulties.', 'Entrances and signs become easier to use. The couple can choose a familiar route suited to their mobility.'],
          ['Strengthen links to transport', 'Improve public connections for people with different walking abilities.', 'There is less detouring to the station, making public transport more accessible to slower walkers too.']
        )
      },
      kumar: {
        title: 'Leaving the flat is only part of the journey',
        dialogue: [
          'Mother can sit securely at home, but a medical appointment means getting through the doorway, lift and several links downstairs. The difficult point is not always the same one.',
          'Would a ramp at the door be enough?',
          'First check whether it suits the entrance, then whether the route outside connects. We want Mother to be more comfortable, rather than relying on family members to lift her over every obstacle.'
        ],
        need: 'We want improvements at the home entrance to connect with public routes, helping Mother reach the pickup point from home.',
        options: options(
          ['Check an actual journey', 'Go through the journey with the family and coordinate existing pickup arrangements and usable entrances.', 'The family do less last-minute searching. Physical obstacles still need appropriate improvements.'],
          ['Match improvements to the entrance', 'Check suitable grab bars and entrance-access measures against the flat and Mother’s actual use.', 'The entrance works better for her. Public-area problems still require their own measures.'],
          ['Complete the public pickup connection', 'Improve the connection between the residential public exit and a usable pickup location.', 'One break in the journey is addressed. Better access does not mean professional care has also been arranged.']
        )
      },
      students: {
        title: 'Accessible routes are not only for older people',
        dialogue: [
          'A classmate injured his foot and came over for group work. A spot we normally step across meant a long detour for him. We had never noticed.',
          'How do you see this route now?',
          'It is not a ramp just for “them”. It helps us with luggage and heavy things too. If everyone uses it, we cannot leave boxes in the way for convenience.'
        ],
        need: 'We want public routes to work for people in different circumstances, and residents to understand how to avoid blocking them again.',
        options: options(
          ['Clear the route and explain its use', 'Show residents which places must remain continuously passable.', 'Temporary obstructions decrease. Structural difficulties still need attention.'],
          ['Repair common ramps and wayfinding', 'Address identified damage and unclear signs.', 'The injured classmate finds usable entrances more easily, and the students start noticing signs along the way.'],
          ['Complete shared accessible facilities', 'Include temporary injuries, pushchairs and mobility-aid users in the improvements.', 'More people can use the same route, and the students see its connection to their own lives.']
        )
      },
      ali: {
        title: 'Coming home at night should be easy to navigate',
        dialogue: [
          'When I come home after a night shift, there are sometimes few people downstairs. Even familiar places make me pause if the lighting or signs are unclear.',
          'What would you improve first?',
          'Look at places that are hard to recognise. Convenient in daylight does not mean equally convenient at night, with poorer vision or on a first visit.'
        ],
        need: 'I want public entrances and routes to be easier to recognise, so people coming home at different times can use them clearly.',
        options: options(
          ['Identify specific difficult spots', 'Record the places residents pass at night and coordinate existing fault reports and temporary guidance.', 'The locations are clearer. Necessary repairs still need to be carried out.'],
          ['Maintain lighting and clear signs', 'Check lights and signs, addressing identified difficulties in recognising the route.', 'People passing at night can identify common entrances more easily. Ali no longer has to stop and work out where to go.'],
          ['Make public entrances easier to recognise', 'Include lighting, contrast and wayfinding in public-environment improvements.', 'People coming home at different times, with weaker vision or for the first time can find their way more easily.']
        )
      }
    }
  };
  years[2] = {
    title: 'How do you work out what makes a suitable home?',
    story: 'Last year, you heard about difficult journeys. This year, residents bring housing information, monthly bills and family schedules to the table. Retired couples, growing families and older people needing support are making different calculations. Your role is to help them understand and compare choices, rather than give everyone the same answer.',
    closing: 'This year, you saw that a home cannot be judged by one price or floor area. Staying, moving smaller, family growth, care and renting make the same arrangement affect people differently. Good housing choices need clear comparisons, while public planning must allow for different ways of living.\n\nA household finding a preferred direction does not mean its budget alone decides everything. Next year brings another question: how does the public goal of a mixed community affect individual housing choices, and how should difficulties be addressed?',
    cases: {
      rahman: {
        title: 'Stay in the current flat, or move somewhere smaller?',
        scene: 'Rahman lays out two sets of information, labelled “stay” and “move smaller”. Noor places their monthly expenses between them.',
        opening: 'We are used to this home, but retirement means thinking about future expenses. Some say move smaller; others say moving may not be necessary. Both sound reasonable. We want to understand what each choice actually changes.',
        questions: [
          { question: 'What matters most if you can keep living here?', reply: 'Familiar routes, neighbours and the way we have arranged our home. But staying also means checking how our money will last. Attachment should not stop us asking questions.' },
          { question: 'What makes the decision difficult now?', reply: 'Staying keeps our friends and routines, but what about future expenses? A smaller home might be easier to manage, but we must include what it costs and how we would see old friends. I do not want to rush just because a scheme has a promising name.' }
        ],
        need: 'We want to compare the real effects of staying and moving smaller, considering retirement expenses and familiar daily life before deciding whether to apply.',
        options: options(
          ['Compare the two ways of living', 'Help the couple organise expenses, family views and preferences about staying, and find official information to compare.', 'They distinguish what they want to keep from what needs checking. This does not establish eligibility for any scheme.'],
          ['Check suitable housing and retirement options', 'Have appropriate advisers explain relevant options and household financial implications, without treating a possibility as approval.', 'The couple have a more concrete basis for comparison and can proceed according to their circumstances. Actual outcomes depend on the conditions.'],
          ['Plan long-term housing choices for ageing', 'Support continuing precinct planning for senior-friendly housing and daily amenities while retaining the needs of people who stay.', 'The community is better prepared for ageing. The couple still need to compare and apply separately; public investment does not allocate them a flat.']
        )
      },
      lin: {
        title: 'Does a bigger flat always fit better?',
        scene: 'The five-year-old does crafts at the table while the two-year-old spreads blocks across the floor. Lin Zhihao studies housing information, and Zhou Jiaying brings the household accounts.',
        opening: 'As the children grow, we are wondering whether there will be enough room. But another room is not the whole answer. We must also work out how we would live month to month after buying.',
        questions: [
          { question: 'What would you compare besides the flat price?', reply: 'Monthly payments, commuting, school runs and support for family. A bigger flat that sends us travelling for much longer every day may not suit us.' },
          { question: 'Would you want the government to give everyone one answer?', reply: 'We want official information about eligibility, possible grants and loans first, then to see what we can sustain. Just because our neighbours can buy something does not mean we should copy them.' }
        ],
        need: 'We want affordable housing options suited to growing children, with commuting and family support considered together.',
        options: options(
          ['Clarify the family’s housing needs', 'Help the family prioritise space, monthly expenditure and care arrangements, rather than treating floor area as the only goal.', 'For the first time, their most important conditions are on one page. The comparison goes beyond the number of rooms.'],
          ['Arrange housing-budget advice', 'Help them understand HFE and budgeting information and compare ongoing commitments after purchase.', 'They can judge choices more realistically. Advice does not guarantee grants, loans or a particular flat. Game resources represent assistance, not an HDB fee for an HFE application.'],
          ['Plan housing amenities for growing families', 'Include family-suited housing choices and children’s everyday facilities in long-term community planning.', 'Housing and children’s amenities are considered together. The family’s discussion expands from one flat to the place where they may live.']
        )
      },
      chen: {
        title: 'A suitable home must also feel right to me',
        dialogue: [
          'My daughter showed me information about 2-room Flexi flats and Community Care Apartments. She is thinking ahead. But I still want to stay here. Being old does not make one option automatically best.',
          'What would you like to compare?',
          'How easy the home is to manage, whether I want to move and what support is nearby. Explain those first, then ask how I want to live.'
        ],
        need: 'I want to understand the different senior-housing options and have my wish to stay in this community included in the decision.',
        options: options(
          ['Listen to her views on staying', 'Let family members separately explain their concerns and preferences.', 'Her own voice enters the discussion. Family members’ good intentions do not become a decision to move.'],
          ['Explain senior-housing differences', 'Explain that housing design, services and eligibility conditions must be checked separately.', 'She can compare options more clearly. No housing type is presented as the answer for every older person.'],
          ['Plan for both staying and moving', 'Include senior-friendly housing and daily support for existing residents in community planning.', 'Public arrangements support more than one housing path. Chen retains her own choice.']
        )
      },
      kumar: {
        title: 'What does a housing label really say about care?',
        dialogue: [
          'We saw the Community Care Apartments information and understand the idea of combining housing with care services. Mother wants to live with family, though, so we need to look closely at suitability.',
          'What do you most want to check?',
          'The actual services, whether they fit Mother and how family would visit. A lovely room photograph does not mean every kind of support is included.'
        ],
        need: 'We want to compare housing and its services together, finding a direction that suits Mother and her relationship with the family.',
        options: options(
          ['Clarify household living preferences', 'Invite Mother and her family to describe the parts of daily life they want to keep.', 'Her wishes and the family’s concerns are both expressed. The discussion goes beyond rooms and facilities.'],
          ['Check housing and service scope', 'Look into possible options, actual services and application conditions.', 'The family can compare more reliably, rather than treating a housing name as a promise of care.'],
          ['Include care-friendly housing in planning', 'Consider housing together with nearby support and access.', 'Long-term arrangements begin connecting the home, support and family visits, rather than handling them separately.']
        )
      },
      students: {
        title: 'Our room is also our landlady’s retirement plan',
        dialogue: [
          'Our landlady says renting out spare rooms is part of her retirement income. The same room supports her later life and gives us somewhere affordable during our studies.',
          'What do both sides need to clarify?',
          'Whether the rental arrangement may change, and when we will know. She has plans, and we need time to compare budgets and journeys to university.'
        ],
        need: 'We want to understand possible rental changes early enough to compare housing costs and the demands of studying.',
        options: options(
          ['Discuss rental changes early', 'Help both sides discuss timing using clear information.', 'The students can prepare, without erasing either the landlady’s retirement needs or the tenants’ need for stability.'],
          ['Offer suitable housing-information advice', 'Point to reliable information and help tenants compare actual expenses and commuting.', 'The students compare concrete choices, rather than being drawn only to the most prominent rent figure.'],
          ['Include tenants in long-term planning', 'Consider actual users who are not owners when planning housing and daily amenities.', 'People who live here without owning a flat enter housing and amenities discussions. Their actual use of the community becomes clearer.']
        )
      },
      ali: {
        title: 'Lower rent, but what happens to the other costs?',
        dialogue: [
          'Someone recommended a room with lower rent, but it is farther from work. With shifts, convenient transport does not always connect. The apparent saving may not all be a saving.',
          'How would you compare it?',
          'Rent, travel money and time, and whether I can rest properly. I need a life I can keep affording, not just the cheapest line in an advert.'
        ],
        need: 'I want to compare ongoing housing costs and location, finding a place that fits work and rest.',
        options: options(
          ['List the real costs of living there', 'Help identify everyday costs beyond rent and the conditions that matter most.', 'Ali includes commuting and rest in her budget and understands where she is willing to make trade-offs.'],
          ['Check housing and travel information', 'Compare choices using reliable information, without deciding acceptable compromises for her.', 'Rooms and actual journeys are compared together, showing differences beyond monthly rent.'],
          ['Plan housing with everyday connections', 'Consider links between homes, journeys to work and daily facilities in long-term planning.', 'Affordability and everyday convenience are considered together, including the needs of shift workers.']
        )
      }
    }
  };

  years[3] = {
    title: 'A shared community goal, and one household’s difficulty selling',
    story: 'Rahman’s sale documents lie on the dining table, and neighbours have heard about the couple’s plans to move. Some support keeping the policy; others ask why this household bears the difficulty. Others realise their own understanding of eligibility is only hearsay. You must consider both one family’s circumstances and the public goal for the wider community.',
    closing: '“The same policy creates conditions for mixed communities, yet can leave individual households facing unequal waits. Explaining its public purpose and helping individual cases can happen together. Which concrete needs have you addressed, and which difficulties still need follow-up?”\n\nLiving together is only a beginning. Next, residents will face renewal of their shared environment: what exactly do they want to change in the community they share?',
    cases: {
      rahman: {
        title: 'It is not that nobody comes to view the flat',
        opening: 'Another viewer came. They liked the flat and were willing to discuss the price. Then the transaction conditions were checked, and this sale could not proceed. We moved the furniture around for the viewing, then put the papers back in the drawer again.',
        questions: [
          { question: 'What worries you most now?', reply: 'Not knowing how much longer we must wait. We want a home that is easier to manage later in life, but every plan moves back with the sale of this flat.' },
          { question: 'How do you see the policy?', reply: 'We understand why living together matters, and we like our neighbours. Understanding that does not remove months of worry. At least help us understand the practical options still available.' }
        ],
        need: 'We want someone to check this restriction, explain feasible sale and assistance options, and follow up rather than simply telling us to keep waiting.',
        options: options(
          ['Clarify the restriction and next steps', 'Organise the actual transaction details and help the couple find a clear source of advice.', 'They know what needs checking and can adjust sale expectations. Explaining the rules has not sold the flat.'],
          ['Arrange individual sale advice and support', 'Help appropriate professionals understand the flat, the selling process and family plans, and explain assistance they can ask about.', 'The case receives more specific advice. Any actual transaction still depends on conditions and both parties.'],
          ['Strengthen continuing housing-transition support', 'Include ongoing case follow-up and housing choices for different life stages in longer-term arrangements.', 'The couple receive more than a one-off answer, and later options become clearer. Support needs public resources and does not mean an automatic exemption.']
        )
      },
      chen: {
        title: 'Do not reduce a neighbour to a label',
        opening: 'I heard they are having trouble selling. Downstairs, someone immediately blamed the quota. Someone else said that if it is policy, there is nothing to discuss. Both were too quick.',
        questions: [
          { question: 'What difference does living together make to you?', reply: 'People who once were strangers start looking after one another’s things and notice whose children have grown up. If everyone gathers only with familiar people, many relationships never begin.' },
          { question: 'What about the couple’s difficulties now?', reply: 'Those are real too. Liking this neighbourhood does not let me tell them not to worry. Explain the public purpose and where they can get help, rather than leaving neighbours to blame each other.' }
        ],
        need: 'I want people to understand why integration policy exists and listen seriously to affected families, rather than treating them as ethnic labels.',
        options: options(
          ['Explain the rules through concrete examples', 'Distinguish policy purpose, transaction restrictions and individual circumstances in everyday conversations.', 'Chen can explain her understanding more clearly, with less simplistic blame among neighbours. Views may still differ.'],
          ['Bring in appropriate policy advice', 'Answer common misconceptions in plain language and reserve private questions for individual consultations.', 'Public discussion has a factual basis. The couple do not have to disclose all their family circumstances in public.'],
          ['Improve shared resident spaces', 'Create conditions for everyday encounters across backgrounds, alongside clear policy information.', 'There are more opportunities for natural contact. Facilities do not automatically remove prejudice or replace sale assistance.']
        )
      },
      lin: {
        title: 'Living near family still means checking the options',
        opening: 'The children are six and three this year, and Grandma changes buses whenever she comes to help. We have thought about living closer to family. Hearing about this case made us realise that choosing a flat is about more than distance and price. We are not at the transaction stage yet and do not want rumours to rule places out.',
        need: 'When considering housing closer to family, we want to understand the applicable conditions and feasible choices rather than guess eligibility from neighbours’ comments.',
        options: options(
          ['Organise the family’s housing questions', 'Separate distance, everyday arrangements and conditions that still need checking.', 'The family know what to ask first. Unverified questions are no longer treated as conclusions.'],
          ['Offer advice for this household', 'Compare options using the family’s actual information.', 'Plans to live near family become more concrete. Advice does not guarantee that a particular flat can be bought.'],
          ['Plan amenities for changing families', 'Consider the housing and public-facility needs of different households together.', 'Longer-term choices become more complete. The immediate purchase still requires individual checks.']
        )
      },
      kumar: {
        title: 'Our names cannot answer for us',
        opening: 'Someone saw our names and decided what flats we could buy and where we should live before we had even explained our plans. Family needs, property conditions and policy conditions should be considered separately.',
        need: 'We want housing information based on actual circumstances, without names, appearance or other people’s impressions replacing eligibility checks.',
        options: options(
          ['Clarify common mistaken assumptions', 'Encourage people to listen to the household first, then check the actual conditions.', 'The couple can express their needs. A verbal clarification still needs to carry through to later advice.'],
          ['Arrange a private individual check', 'Have appropriate advisers answer questions using the actual information.', 'They receive a more reliable explanation without disclosing private details to correct neighbours’ guesses.'],
          ['Improve public housing-information resources', 'Use varied household situations to show how conditions and choices should be checked.', 'Later users can understand the process more easily. Information supports judgment without deciding everyone’s case in advance.']
        )
      },
      students: {
        title: 'Can someone staying for one year still be a neighbour?',
        opening: 'We may graduate and move out next year. Sometimes we want to join things in the block, but worry that just as people know us, we will leave and they will have to meet the next group. Yet staying out because we are here briefly makes this year feel like nothing more than renting somewhere to sleep.',
        need: 'We want suitable ways to join neighbourhood life even on a short tenancy, and to leave useful experience for the people who come after us.',
        options: options(
          ['Offer manageable ways to participate', 'Let students contribute to small shared tasks suited to their stay, without requiring long-term commitments.', 'They can contribute this year. Turnover will still change relationships.'],
          ['Arrange a shared project for newcomers and residents', 'Use a community activity that can be completed in a short period so tenants and long-term residents work together.', 'People gain a concrete experience of knowing one another. Relationships are not guaranteed to continue after the project.'],
          ['Improve shared learning and social facilities', 'Keep public space available to people with different lengths of residence.', 'Later arrivals also have a way into community life. The space still needs ongoing welcome and use.']
        )
      },
      ali: {
        title: 'Living next door is not the same as knowing someone',
        opening: 'We do live in the same block, but many people have already gone out when I get home. We nod in the lift without even asking names. We live together, yes. We do not yet know one another well.',
        need: 'I want natural opportunities for people who rarely meet everyone else to know their neighbours, rather than merely count as living together on a list.',
        options: options(
          ['Include people with different schedules', 'Introduce neighbours and discuss participation that does not require everyone to attend together.', 'Ali begins to know actual people. One introduction is not yet a close relationship.'],
          ['Organise small gatherings at different times', 'Use everyday interests to give people who seldom meet some shared experience.', 'Some residents have actual contact. Participation remains their own choice.'],
          ['Improve places for everyday encounters', 'Retain public spaces where people can pause and share everyday use.', 'Residents from different backgrounds have more opportunities to meet naturally. Integration still needs continued everyday contact.']
        )
      }
    }
  };
  years[4] = {
    title: 'Neighbourhood renewal is not a copy of the same facilities at every block',
    story: 'A renewal drawing goes up in the community. On the same piece of public space, some want children to run and play, some want somewhere quiet to pause, and others need tables for flexible use. Everyone has a reason, but the area on the plan does not grow with their wishes.',
    closing: '“Public renewal means more than adding facilities. Neighbouring precincts can complement one another, and residents see the same drawing through their own journeys, ages and living arrangements. Government funding provides the construction resources; resident participation asks whether those improvements fit everyday life.”\n\nThis year, you compared who public space is for and what it should do. Next year adds a different question: even a well-arranged place may become too hot to stay in when people most need it. Planning must also understand how the environment itself works.',
    cases: {
      chen: {
        title: 'Can I stay downstairs without joining an activity?',
        opening: 'There are so many activities on the drawing. It looks lively. I like watching children play, but sometimes I only want to sit and watch people, without joining anything. Could some of the space be kept for that?',
        questions: [
          { question: 'What kind of use do you most want to keep?', reply: 'Somewhere I can just go downstairs and stay for a while, without signing up or waiting for an event. People can talk if they like, and stay quiet without feeling that they are taking someone else’s place.' },
          { question: 'What do you think of the Lins’ wish for more children’s facilities?', reply: 'Children need to play, of course. I am not asking to keep everything for older people. But if equipment fills the whole area, there is nowhere to sit quietly. Could we consider the different uses separately?' }
        ],
        need: 'I want renewal to retain everyday resting space independent of organised activities, with room for both lively and quiet uses.',
        options: options(
          ['Coordinate shared use of existing space', 'Let different users explain their needs, and keep a clearly identified area outside organised activities for now.', 'Chen’s everyday use is included. Existing area and facilities still limit what can fit.'],
          ['Compare public-space layouts', 'Ask designers to show how different zones affect activities and quiet use.', 'Residents can see the trade-offs and Chen can give concrete feedback. Choices must still fit a limited area.'],
          ['Build shared space with room to pause', 'Include everyday rest alongside activities instead of filling the entire area with fixed equipment.', 'Both rest and activity have a place. Their scales still cannot both be maximised.']
        )
      },
      lin: {
        title: 'Children need a place for real activity too',
        opening: 'The children are seven and four this year. We understand Auntie Chen wanting to sit quietly, but a few tables and chairs leave the children bored quickly. There should also be things that genuinely let them run, try and explore.',
        questions: [
          { question: 'What facilities would be useful to your family?', reply: 'Suitable for different ages, easy for parents to supervise, and not everyone crowded around one piece of equipment. If something similar is already nearby, look at which activities are still missing.' },
          { question: 'What if the whole area cannot become children’s facilities?', reply: 'We are willing to share and do not need a copy at every block. But parents being busy and unable to attend every meeting should not make children’s needs count for less.' }
        ],
        need: 'We want practical activity choices for growing children within limited public space, complementing nearby facilities while retaining other residents’ uses.',
        options: options(
          ['Arrange children’s use of existing spaces', 'Check nearby activity resources and retain suitable opportunities for children in existing spaces.', 'Children gain some activity choices. Fixed facilities and capacity have not increased.'],
          ['Compare flexible and fixed facilities', 'Ask designers to combine age, supervision and multipurpose needs in their proposals.', 'The Lins can see what different arrangements provide. Flexible sharing also means the space is not exclusively for children.'],
          ['Focus investment on age-suitable play facilities', 'Provide missing activity types nearby, explaining the public space they occupy.', 'Children’s activity conditions improve more fully. Less area remains for quiet rest and other uses, which still need a response.']
        )
      },
      rahman: {
        title: 'Government funding is still worth asking about',
        opening: 'It is good to hear that the government funds the programme. But not having to raise the money ourselves does not remove the need to ask residents what should change. If the games table moves, people should say whether old friends can still sit comfortably.',
        need: 'We want clear reasons for public-investment priorities across blocks and households, rather than simply serving whoever attends most often.',
        options: options(
          ['Explain the reasons for investment priorities', 'Explain the scope, needs and trade-offs, recording views that are not yet covered.', 'The couple understand the basis for decisions. Explanation does not mean every household agrees with the order.'],
          ['Compare the public benefits of different layouts', 'Use specific patterns of use to show who gains which improvements.', 'Discussion moves beyond arguments over facility counts. Choices still have to be made.'],
          ['Provide complementary precinct facilities', 'Consider existing facilities and missing uses across neighbouring areas.', 'Public investment duplicates less. Benefits and distance from home still differ between households.']
        )
      },
      kumar: {
        title: 'Please ask Mother what she wants too',
        opening: 'We were going to choose a lively activity area for Mother, thinking she would have company. But she looked at the plan and wanted somewhere to see flowers and sit whenever she liked. We cannot always attend briefings, and she may not speak in a crowd. That does not mean she has no views.',
        need: 'We want the actual user’s preferences heard, including people unable to attend, rather than counting only who joins the discussion.',
        options: options(
          ['Include users and people who could not attend', 'Let family members express preferences separately, distinguishing absence from having no needs.', 'Mother’s wishes are no longer replaced by the family’s good intentions. Ways to contribute must remain available.'],
          ['Explain understandable proposals individually', 'Help people with different communication preferences compare everyday uses.', 'Feedback better reflects individual choices. One response cannot stand for everyone of the same age.'],
          ['Improve gardens and rest areas for independent use', 'Provide an environment that does not require joining a group activity.', 'People who prefer quiet time gain a choice. Activity facilities and other uses still need coordination.']
        )
      },
      students: {
        title: 'We use this place even if we do not own a flat',
        opening: 'Someone said we need not look at the plan because we are not owners. But group work needs room to open laptops, and sometimes we want to make things together. If everything is fixed equipment, flexible use is difficult. We are not here to vote for someone else, only to explain these uses.',
        need: 'We want renewal to consider multipurpose space for learning, displays and flexible exchange, while distinguishing user feedback from formal voting eligibility.',
        options: options(
          ['Record actual multipurpose uses', 'Let tenants explain their needs and clarify the difference between feedback and voting eligibility.', 'The students’ experience enters the discussion. This does not give them additional voting rights.'],
          ['Design flexible-use space', 'Compare the allocation of movable tables, fixed facilities and public area.', 'Learning and social needs can be compared with other uses. Flexible space still has capacity limits.'],
          ['Improve open multipurpose public space', 'Keep facilities adaptable to different activities instead of fixing the entire area to one purpose.', 'Later residents can also find their own uses. The scale of specialised activities may need to give way.']
        )
      },
      ali: {
        title: 'Existing uses cannot all disappear during renewal',
        opening: 'I support improvements, but everyone discussing the drawing talks about after completion. If several places are fenced off at once, exercise, rest and everyday services could all stop together. Where do we go that year? Could some uses stay open while others are renewed?',
        need: 'I want clear phasing that keeps essential public uses and services available during construction, rather than removing every option at once.',
        options: options(
          ['Explain sequencing and temporary arrangements', 'Tell residents which uses remain first and which need alternatives.', 'Ali can prepare. Temporary alternatives may be less convenient than the originals.'],
          ['Refine phased work and service continuity', 'Compare implementation sequences and check essential uses affected.', 'The extent affected at any one time is clearer. Phasing may also extend the total completion time.'],
          ['Coordinate phased public-facility renewal', 'Plan improvement projects together with continuing operation, retaining essential choices.', 'Renewal can better proceed alongside everyday life. Construction costs and disruption still need to be borne.']
        )
      }
    }
  };

  years[5] = {
    title: 'What makes cooling a real improvement to everyday life?',
    story: 'In earlier years, you often asked what facility a place lacked. This year, seats and activity areas exist, yet residents may not use them. You need to ask how the environment changes throughout the day, and who can actually use it.',
    closing: 'You discover that comfort means more than having facilities: people must also be able to use them in a hot environment. Next year brings new questions. How much energy and water do comfort and public services require? How do green facilities keep working over time?',
    setting: 'A hot spell leaves familiar public places quiet in the afternoon. Beside the activity area is an existing thicket. Some want to clear part of the planting to expand shaded activity space; others worry that replacing layered vegetation with tidy lawn would lose habitat. The community is also comparing cool coatings and carpark-roof greenery. These blocks, hot spots, plants and candidate spaces are fictional game settings, not actual projects.',
    cases: {
      lin: {
        title: 'There is a play area, but afternoons are too hot',
        scene: 'The eight-year-old shows a drawing with the playground coloured deep orange. The five-year-old says they want to stay indoors in the afternoon.',
        opening: 'It is not that there is nowhere nearby to play. But after school, when we have time, the ground is hot in the sun. After a little running, the children crowd into the shade.',
        questions: [
          { question: 'Would more play equipment help?', reply: 'They would enjoy something new, but it would still be under the same sun. First, we want to know when there is shade and where people can pause, without obstructing the existing breeze.' },
          { question: 'Is this only a concern for families with children?', reply: 'We have seen Auntie Chen nearby waiting for the sun to weaken. The students say the thicket matters too, and we are willing to hear why. But if the activity area exists only on a plan and remains too hot in the afternoon, the children have gained no usable space.' }
        ],
        need: 'We want children to actually use nearby activity space after school, with better shade and places to pause rather than simply more equipment.',
        options: options(
          ['Adjust use during the hottest hours', 'Move some activities to more suitable times and existing sheltered places, explaining the changes to users.', 'Children temporarily have a more comfortable option. The original area remains exposed in the afternoon, and the timing may not suit every family.'],
          ['Check sun exposure and outdoor comfort', 'Have appropriate personnel study shade, wind and times of use, addressing local issues that can be handled now.', 'Improvements better match actual use. Local measures cannot change the thermal environment of the whole area.'],
          ['Improve shade and planting around the activity area', 'Add shade and planting in suitable positions while retaining access and necessary sightlines.', 'Children and other residents can stay more comfortably. Plant growth, upkeep and use across seasons still need attention.']
        )
      },
      chen: {
        title: 'Cooler indoors, but what about downstairs?',
        scene: 'She places an introduction to exterior-wall coatings beside the fan.',
        opening: 'Someone said the block will be cooler after this paint is applied. I do not understand: will indoors be like air-conditioning, or will it be less hot downstairs too?',
        questions: [
          { question: 'Where would you most like things to improve?', reply: 'I want home to be comfortable, of course. But I do not want to stay inside all day. The roadside and seats downstairs also need to be comfortable enough for an afternoon pause.' },
          { question: 'What if the activity room runs more air-conditioning?', reply: 'It would give people somewhere to rest. But we still have to get there, and outdoor places cannot be ignored indefinitely. Explain which measure improves which part.' }
        ],
        need: 'I want buildings and the shared environment downstairs to become less affected by heat over time, and to know what each measure can actually achieve.',
        options: options(
          ['Explain cooling measures and available rest places', 'Distinguish coatings, shade and indoor rest spaces so residents can choose suitable times and places.', 'Chen can plan her day better. Knowing how to avoid heat does not mean the public environment is already cooler.'],
          ['Check heat around blocks and public areas', 'Understand strong sun exposure and residents’ actual use, then identify targeted improvements feasible now.', 'Investment better responds to the real difficulty. The same temperature change cannot be guaranteed in every flat and at every hour.'],
          ['Advance suitable building and outdoor cooling', 'Use technical conditions to plan cool coatings and public-environment improvements, explaining their scope and upkeep.', 'Heat receives a more comprehensive response. These measures do not replace air-conditioning or promise a fixed temperature reduction in every home.']
        )
      },
      rahman: {
        title: 'Who will look after the rooftop garden?',
        scene: 'Rahman points at a drawing of the carpark roof.',
        opening: 'Someone suggested growing vegetables up there. I am interested, but first explain access, shade and whether people can keep planting over time.',
        questions: [{ question: 'Would it only welcome people who know how to garden?', reply: 'No. Looking at plants and sitting for a while are good too. Do not divide the whole public space into private plots.' }],
        dialogue: ['Rahman points at a drawing of the carpark roof: “Someone suggested growing vegetables up there. I am interested, but first explain access, shade and whether people can keep planting over time.” You ask whether it would welcome only gardeners. Noor says: “No. Looking at plants and sitting for a while are good too. Do not divide the whole public space into private plots.”'],
        need: 'We want greenery that invites participation while leaving room for non-gardeners, with upkeep arrangements that can continue.',
        options: options(
          ['Ask about green-space uses and participation', 'Understand different expectations for gardening, rest and everyday management first.', 'Views become more specific. Interest does not mean someone can take on all the upkeep indefinitely.'],
          ['Assess suitable rooftop greenery', 'Check conditions and compare low-maintenance greenery with participatory gardening.', 'Feasible forms become clearer. Not every carpark roof suits the same model.'],
          ['Create a suitable shared green space', 'Use the assessment to plan greenery, access and public use.', 'Residents have closer contact with nature. Management, water use and public access still need continuing arrangements.']
        )
      },
      kumar: {
        title: 'Green shade can change whether someone wants to go out',
        scene: 'Devi speaks.',
        opening: 'Mother likes looking at flowers and plants of different heights, rather than only a lawn.',
        questions: [{ question: 'Would denser planting be enough?', reply: 'When she is seated, she wants to see people, with room beside her for someone accompanying her. Tidy lawn and layered planting have different uses. We cannot choose only from an illustration.' }],
        dialogue: ['Devi says: “Mother likes looking at flowers and plants of different heights, rather than only a lawn.” You ask whether denser planting would be enough. Kumar replies: “When she is seated, she wants to see people, with room beside her for someone accompanying her. Tidy lawn and layered planting have different uses. We cannot choose only from an illustration.”'],
        need: 'We want nearby greenery and rest areas to work for people with different physical abilities, rather than merely look good from upstairs.',
        options: options(
          ['Understand how different residents use green space', 'Tell the project team about needs for rest, movement and shade.', 'Users who seldom speak are recognised. The actual environment still needs improvement.'],
          ['Check the usability of greenery and rest areas', 'Check key places of use and address local problems that can be handled.', 'Some residents can use the space more easily. This does not mean all greenery serves the same function.'],
          ['Improve accessible green rest areas', 'Coordinate planting with shade, seating and public connections.', 'Outdoor pauses become easier. Care and medical needs remain the responsibility of the relevant services.']
        )
      },
      students: {
        title: 'There is more than one kind of green',
        scene: 'The students point to the edge of the activity area that the Lins hope to expand.',
        opening: 'We know children need afternoon shade, but the thicket is not just empty space. Replacing it with lawn and activity surfaces may still look green while changing what it does.',
        questions: [{ question: 'What is your evidence?', reply: 'We have seen birds and insects. Those are clues, not a substitute for assessment. Could we first find out what is worth retaining, then discuss the activity boundary?' }],
        dialogue: ['The students point to the edge of the activity area that the Lins hope to expand: “We know children need afternoon shade, but the thicket is not just empty space. Replacing it with lawn and activity surfaces may still look green while changing what it does.” You ask for their evidence. They reply: “We have seen birds and insects. Those are clues, not a substitute for assessment. Could we first find out what is worth retaining, then discuss the activity boundary?”'],
        need: 'We want green improvements to consider existing plants and animals, shade and human use, rather than only which illustration looks prettier.',
        options: options(
          ['Use existing shaded places for activities first', 'Let families and students share their use and observations, without treating the thicket as spare land to clear at will.', 'Children gain some interim alternatives, with time to understand the vegetation’s value. Afternoon use of the original area remains limited.'],
          ['Compare retained vegetation and activity boundaries', 'Assess existing planting, ecological clues and sun exposure to propose different layouts.', 'Residents can compare the effects of retention, adjustment and expansion. No plan can expand every use without limit.'],
          ['Retain important vegetation and adjust activity space', 'Retain valuable planting based on assessment, providing suitable shade and activity boundaries elsewhere.', 'Ecology and outdoor use enter the same design. Activity expansion must make some concessions, while planting needs ongoing upkeep and observation.']
        )
      },
      ali: {
        title: 'Indoor and outdoor comfort need different responses',
        scene: 'She sees the activity room crowded with people escaping the heat.',
        opening: 'Opening an air-conditioned space helps, but it also puts everyone in the same place.',
        questions: [{ question: 'What concerns you most?', reply: 'Can we improve outdoor heat conditions while organising indoor use? One air-conditioner should not be expected to solve every problem.' }],
        dialogue: ['She sees the activity room crowded with people escaping the heat: “Opening an air-conditioned space helps, but it also puts everyone in the same place.” You ask what concerns her most. She says: “Can we improve outdoor heat conditions while organising indoor use? One air-conditioner should not be expected to solve every problem.”'],
        need: 'I want community cooling to consider indoor refuge, outdoor use and public resource consumption, rather than only adding one air-conditioned space.',
        options: options(
          ['Coordinate use of heat-refuge spaces', 'Explain opening hours and capacity, considering different groups.', 'Existing resources are used more orderly. This does not resolve heat across the area.'],
          ['Check comfort and energy use', 'Study the activity room and its surroundings and propose suitable adjustments.', 'Measures work together better. Some improvements still require later investment.'],
          ['Combine building and public-environment cooling', 'Include suitable cooling measures in long-term improvements.', 'The response no longer relies on one space. Operating energy and upkeep still need long-term management.']
        )
      }
    }
  };
  years[6] = {
    title: 'Unseen systems also support life downstairs',
    story: 'The community discusses its next green improvements: rooftop solar, smart lighting, rainwater use, recycling and charging facilities. Some expect smaller private bills; others worry about reliable public facilities. Residents who do not drive ask which investments will benefit them. Behind familiar daily life, you must understand system purposes, operation and resource allocation.',
    closing: 'You begin to distinguish what equipment is installed from what a system actually provides. Next year, the question grows to the precinct’s future: can additional housing, existing services, green infrastructure and the natural environment work together in one long-term plan?',
    setting: '',
    cases: {
      students: {
        title: 'Rooftop solar: which electricity use does it save?',
        scene: 'The students compare a personal electricity bill with information about rooftop solar.',
        opening: 'We thought panels on our block’s roof meant cheap solar power for our rented rooms. Then we read about lifts, corridor lights and water pumps and realised those are different things.',
        questions: [
          { question: 'How did you originally understand the project?', reply: 'We thought our air-conditioning bills would fall straight away. Now we want to understand savings in common services separately from our own electricity use. Do not mix the two benefits together.' },
          { question: 'Does it still matter without directly reducing your bill?', reply: 'Of course. Public services use power every day. We want to see the actual purpose and know how normal operation will be checked after installation.' }
        ],
        need: 'We want green-energy projects to distinguish common-service electricity from household use, explaining actual purposes, operation and expected effects.',
        options: options(
          ['Explain common-service and personal electricity', 'Use familiar lifts, lights and pumps to explain the project and distinguish public energy use from household bills.', 'The students no longer mix different promises together. Explanation alone does not reduce energy use.'],
          ['Check common energy use and saving opportunities', 'Have appropriate personnel assess existing systems, explain feasible measures and how effects can be checked.', 'Investment priorities are clearer. Expected savings cannot be counted as already achieved.'],
          ['Advance suitable public energy-saving systems', 'Deploy solar or suitable efficiency improvements according to technical conditions, with operating arrangements.', 'Public services gain more sustainable energy support. Private electricity bills are not automatically reduced for every household.']
        )
      },
      lin: {
        title: 'Where can collected rainwater be used?',
        scene: 'The children, nine and six, look at a rainwater-collection diagram and ask whether it supplies water for cleaning public surfaces.',
        opening: 'The children asked whether collected rain could be piped home for drinking. We realised we had not separated the different uses of public water either.',
        questions: [
          { question: 'What would you like to understand first?', reply: 'How the water is used and which systems must remain separate. Also how it relates to drainage during heavy rain. Calling it flood prevention should not make everyone think no storm can cause problems.' },
          { question: 'What everyday effects should a system consider?', reply: 'Someone still needs to clean and water plants, and the equipment needs upkeep. We want the children to learn water conservation, rather than only see another tank.' }
        ],
        need: 'We want clear uses and limits for public rainwater collection, saving water while retaining reliable cleaning and drainage arrangements.',
        options: options(
          ['Explain public water use and conservation', 'Use cleaning and irrigation to explain non-potable uses, listening to residents’ questions.', 'Residents can support conservation better. Rainwater cannot count as reused before a collection system is implemented.'],
          ['Assess rainwater collection and public water use', 'Check the site, purposes and operating conditions to compare feasible resource improvements.', 'The scope becomes clearer. Retaining some rainwater does not remove every flood or ponding risk.'],
          ['Implement suitable rainwater use', 'Use an appropriate technical design for public non-potable purposes, with maintenance arrangements.', 'Some public water use is replaced. Drinking water and other uses remain separate systems, with effects depending on weather and operation.']
        )
      },
      rahman: {
        title: 'Dimmed lights: saving energy, or a fault?',
        scene: 'Noor speaks.',
        opening: 'The corridor lights dim when nobody is there, then brighten as someone approaches. Some neighbours think they are broken; others feel safer if they stay bright.',
        questions: [{ question: 'What would you like done?', reply: 'First explain normal operation, while still fixing places that genuinely do not light up. Saving power should not mean walking in the dark.' }],
        dialogue: ['Noor says: “The corridor lights dim when nobody is there, then brighten as someone approaches. Some neighbours think they are broken; others feel safer if they stay bright.” You ask what they would like done. Rahman says: “First explain normal operation, while still fixing places that genuinely do not light up. Saving power should not mean walking in the dark.”'],
        need: 'We want smart lighting to save energy while residents understand normal changes and retain lighting for confident passage.',
        options: options(
          ['Explain sensor-controlled lighting', 'Distinguish normal adjustment from faults needing reports, and collect feedback on specific locations.', 'Misunderstandings decrease. Genuine lighting issues still need attention.'],
          ['Check sensing and lighting performance', 'Have personnel check actual use, adjust suitable settings and address faults.', 'Energy saving and everyday access work together better. Residents putting up with problems is no substitute for appropriate configuration.'],
          ['Update suitable public smart lighting', 'Match an efficient system and operational monitoring to site needs.', 'Public lighting becomes more efficient. Sensors, lamps and maintenance still need to remain reliable.']
        )
      },
      kumar: {
        title: 'Public services must remain reliable after energy savings',
        scene: 'Kumar sees information about energy recovery beside the lift.',
        opening: 'This recovers energy from the lift’s movement. It does not mean the lift will never stop working after it is installed, does it?',
        dialogue: ['Kumar sees information about energy recovery beside the lift: “This recovers energy from the lift’s movement. It does not mean the lift will never stop working after it is installed, does it?” Devi adds: “When Mother needs to go out, we worry about hearing only how much is saved, with no explanation of continuing maintenance.”'],
        need: 'We want public energy improvements to preserve reliable services such as lifts, with a clear distinction between energy savings and maintenance responsibilities.',
        options: options(
          ['Explain energy savings and service arrangements', 'Explain the project’s scope and give advance notice of work and checks affecting services.', 'The family can prepare better. Explanation does not eliminate equipment faults.'],
          ['Check efficiency and operating condition', 'Assess appropriate improvements alongside the condition of everyday equipment.', 'Energy investment is better targeted. Required safety maintenance must continue.'],
          ['Improve suitable lift energy efficiency', 'Implement measures such as energy recovery where applicable while retaining maintenance arrangements.', 'Common energy use becomes more efficient. This does not automatically solve every breakdown or access issue.']
        )
      },
      chen: {
        title: 'Where should an old appliance go to be recycled?',
        scene: 'She points to an old radio she no longer uses.',
        opening: 'Someone told me to put it in a recycling bin, but the bins downstairs look rather similar.',
        questions: [{ question: 'Would you check the labels first?', reply: 'That is why I want to ask. We should not assume every old thing belongs in the same bin.' }],
        dialogue: ['She points to an old radio she no longer uses: “Someone told me to put it in a recycling bin, but the bins downstairs look rather similar.” You ask whether she would check the labels first. She smiles: “That is why I want to ask. We should not assume every old thing belongs in the same bin.”'],
        need: 'I want recycling arrangements that are easy to recognise, so I know which items belong and which need a different channel.',
        options: options(
          ['Explain the different recycling destinations', 'Use existing collection-point labels to explain accepted items, rather than treating every unwanted object alike.', 'Chen can deposit items more correctly. Each collection point’s actual requirements still apply.'],
          ['Offer suitable recycling assistance', 'Contact appropriate services for items residents cannot easily deliver themselves.', 'Some unwanted items have somewhere to go. One collection does not replace future sorting.'],
          ['Improve suitable separated-recycling facilities', 'Provide clear, usable recycling arrangements and management in suitable locations.', 'Handling resources becomes easier. Effectiveness still depends on correct use and subsequent collection.']
        )
      },
      ali: {
        title: 'Does green commuting include people who do not drive?',
        scene: 'Ali looks at a proposal for charging facilities in the carpark.',
        opening: 'I understand that drivers switching to electric vehicles need charging. But I still walk and take public transport after work. Can green-commuting discussions also consider how we reach the station and where bicycles go, rather than only counting chargers?',
        questions: [{ question: 'Are you against charging facilities?', reply: 'No. Look at actual needs first and include people who do not drive in the same arrangements.' }],
        dialogue: ['Ali looks at a proposal for charging facilities in the carpark: “I understand that drivers switching to electric vehicles need charging. But I still walk and take public transport after work. Can green-commuting discussions also consider how we reach the station and where bicycles go, rather than only counting chargers?” You ask whether she opposes charging facilities. She says: “No. Look at actual needs first and include people who do not drive in the same arrangements.”'],
        need: 'I want green-commuting investment to consider different modes, meeting charging needs while giving walkers, cyclists and public-transport users practical improvements too.',
        options: options(
          ['Hear how different travellers use the area', 'Compare everyday driving, walking, cycling and interchange journeys, explaining existing facilities and unmet needs.', 'People who do not drive enter the discussion too. Existing capacity and conditions have not changed.'],
          ['Compare charging and active-travel provision', 'Check carpark use, charging demand, bicycle parking and interchange conditions with the relevant organisations.', 'The proposal explains more clearly whom it serves and what space it occupies. The player alone cannot promise changes to bus frequencies.'],
          ['Combine suitable green-commuting facilities', 'Provide charging alongside cycling and interchange improvements where technical and management conditions allow.', 'Transition investment serves more than one travel mode. Public space and maintenance resources must be allocated, with trade-offs in scale.']
        )
      }
    }
  };

  years[7] = {
    title: 'How should new homes join a place where people already live?',
    story: 'Earlier decisions often began with one household’s need. In the final year, you face a plan affecting future residents, existing neighbours and the natural environment. This is not a blank canvas where every benefit can simply be added. Each direction must explain its limits and costs.',
    closing: 'From one person’s journey to housing opportunities, integration and renewal, then heat, public resources and long-term land use, you now see the connections between HDB policies. The final choice is not to give one goal permanent priority. It is to explain why this combination was chosen, whom it serves and which costs still need to be faced.',
    setting: 'A candidate site lies at the edge of this fictional precinct, with no development decision yet made. Preliminary material identifies possible housing and records existing vegetation, drainage and routes people use. Another developed site is suggested as an alternative, but has current uses and an uncertain release date. All locations, study summaries and proposals are fictional. They do not represent Sunset Way, Maju Forest or another actual Clementi project.',
    cases: {
      lin: {
        title: 'New homes also need connections to everyday life',
        scene: 'The children, ten and seven, look for schools and bus stops on the diagram. Lin Zhihao says the family is also thinking about how their household may change.',
        opening: 'Families grow and become smaller. More suitable homes nearby would matter, but homes alone are not enough. Travel, activities and support between family members all need to connect.',
        questions: [
          { question: 'Is the number of additional homes your main concern?', reply: 'Numbers matter, but so do whom they suit, when people can move in and how they reach schools and services. We want choices for parents and younger families, rather than assuming everyone needs the same home.' },
          { question: 'What if retaining more existing nature reduces the development area?', reply: 'We are willing to hear the reasons, but also need to know how housing will be provided. Is another location available in time, and what would existing users bear? Homes cannot just be moved across a diagram.' }
        ],
        need: 'We want housing planning to consider different households and future needs, explaining public services, travel and environmental effects together.',
        options: options(
          ['Strengthen existing provision and compare sites first', 'Organise household needs, use existing services and achievable improvements, and continue explaining alternative-site constraints.', 'Some immediate daily needs gain support. Additional housing needs do not disappear, and an alternative site cannot be promised as immediately available.'],
          ['Refine concentrated development and amenities', 'Commission studies of concentrating homes in a more suitable area, checking transport, services and environmental conditions.', 'The proposal has a stronger basis. Concentration may still bring height, capacity and construction effects, and is not completed housing supply.'],
          ['Advance phased housing and supporting facilities', 'After clarifying environmental boundaries, phase housing, public facilities and connections together.', 'Future households gain a more complete direction. Construction takes time, and unfinished elements and environmental effects still need management.']
        )
      },
      students: {
        title: 'Keeping green space, and keeping what it does',
        scene: 'Two of the former housemates have graduated and started work, though neighbours still call them the “student household”. They place candidate-site photos beside a simplified environmental-study map and notes on a future housing budget.',
        opening: 'We used to notice trees and animals first. Now we are thinking about where we will live too. This plan must fit new homes while retaining continuous natural space. Splitting greenery into small pieces may not preserve its function, but “build somewhere else” does not answer when those homes can be provided.',
        questions: [
          { question: 'How would you respond to the Lins’ concerns about housing numbers and timing?', reply: 'Those are our needs too. First compare which areas really matter and whether the layout and phasing can change. If fewer homes are built here, explain where the additional choices are and how long they will take. We are willing to discuss it, without pretending these options have no cost.' },
          { question: 'Can residents’ observations replace professional studies?', reply: 'The animals we have seen provide clues, nothing more. Explain the surveys, proposals and different views clearly. A nice illustration alone cannot show that everything is balanced.' }
        ],
        need: 'We want planning to retain important ecological connections based on environmental studies, while honestly explaining the housing proposal and remaining effects.',
        options: options(
          ['Organise views and compare conservation directions', 'Explain the questions studies must answer and gather residents’ use and concerns.', 'Discussion becomes more specific. Gathering views does not replace ecological judgment or immediately add homes.'],
          ['Assess and revise the development footprint', 'Use environmental, technical and amenity information to compare avoiding key areas with concentrated layouts.', 'Effects and trade-offs can be judged more clearly. A revised boundary does not remove all remaining effects.'],
          ['Implement phasing with ecological connections', 'Retain important continuous spaces and arrange development and mitigation within suitable areas.', 'Housing and nature have a shared implementation direction. Ongoing management is needed; green area cannot stand in for ecological outcomes.']
        )
      },
      chen: {
        title: 'Build new places, and keep the existing community going',
        scene: 'She speaks.',
        opening: 'I was a newcomer once too, and know people need homes. But the presentation only shows how good the new area will be. Will anyone still look after our existing activity spaces and the area around the hawker centre?',
        questions: [{ question: 'What would you like to keep?', reply: 'I am not saying nothing can change. The older precinct still needs maintenance. Ask users whether familiar activities and stalls could continue if moved.' }],
        dialogue: ['She says: “I was a newcomer once too, and know people need homes. But the presentation only shows how good the new area will be. Will anyone still look after our existing activity spaces and the area around the hawker centre?” You ask what she wants to keep. She says: “I am not saying nothing can change. The older precinct still needs maintenance. Ask users whether familiar activities and stalls could continue if moved.”'],
        need: 'I want long-term development to retain investment and everyday life in the older precinct, rather than treating the existing community as a backdrop to put aside once the new project opens.',
        options: options(
          ['Record existing community uses that must continue', 'Ask daily users which activities, public places and maintenance cannot be interrupted.', 'Reasons for retention become concrete daily needs rather than only nostalgia. Existing resources still need allocation.'],
          ['Compare new construction with older-precinct upkeep', 'Include the condition, use and operating needs of existing facilities in the long-term plan.', 'Discussion recognises investment on both sides, rather than judging improvement only by new floor area.'],
          ['Link new facilities with continuing older-precinct improvements', 'Retain suitable maintenance and public uses in the development sequence.', 'Existing residents have support for continuing daily life. Investment in new and older areas cannot both grow without limit.']
        )
      },
      rahman: {
        title: 'Alternative sites also have life happening on them',
        scene: 'Rahman looks at the alternative candidate site.',
        opening: 'Some say building over there would leave this site alone. But people use that place now too. A blank area on the diagram does not mean nothing is there.',
        dialogue: ['Rahman looks at the alternative candidate site: “Some say building over there would leave this site alone. But people use that place now too. A blank area on the diagram does not mean nothing is there.” Noor adds: “We are willing to compare, but explain the uses and how long we would wait.”'],
        need: 'We want planning to compare genuinely available choices, considering existing uses, timing and the changes different people would bear.',
        options: options(
          ['Explain the real conditions of different sites', 'Tell residents about existing uses and uncertainty over availability.', 'Alternatives can be discussed more fairly. Nobody can promise that no one will be affected.'],
          ['Compare candidate sites and development timing', 'Check availability, the relocation of current uses and amenity needs.', 'Trade-offs become clearer. Studies may show that some choices cannot be implemented in time.'],
          ['Advance phasing that accounts for current uses', 'Arrange continuity for current uses alongside new development in a suitable proposal.', 'People affected by change have a transition arrangement. Time, resources and construction still have real costs.']
        )
      },
      kumar: {
        title: 'How will services keep pace with more homes?',
        scene: 'Kumar speaks.',
        opening: 'We look beyond the number of new blocks. We want to know whether clinics, public transport and other services are considered together.',
        questions: [{ question: 'Are you worried about new neighbours?', reply: 'We are not blaming newcomers. Planning ahead matters, rather than waiting until everyone moves in to discover that services do not connect.' }],
        dialogue: ['Kumar says: “We look beyond the number of new blocks. We want to know whether clinics, public transport and other services are considered together.” You ask whether they are worried about new neighbours. Devi answers: “We are not blaming newcomers. Planning ahead matters, rather than waiting until everyone moves in to discover that services do not connect.”'],
        need: 'We want additional housing planned with public services, access and long-term operating capacity, so households with different needs can all connect.',
        options: options(
          ['Organise households’ service-use needs', 'Explain which times and connections need attention.', 'Actual needs enter the discussion. Gathering views does not directly increase service capacity.'],
          ['Check housing and public-service capacity together', 'Work with relevant personnel to compare expected use, journeys and existing capacity.', 'Development sequencing has a stronger basis. Extra places in a specialised service cannot be promised immediately.'],
          ['Phase amenities together with housing', 'Include suitable public facilities, routes and service space in the same development arrangement.', 'New and existing needs share a direction for provision. Operating staff and service arrangements still need follow-through.']
        )
      },
      ali: {
        title: 'Green projects must become a community that works',
        scene: 'After reading the proposal, she speaks.',
        opening: 'Solar, greenery, rainwater and new connections all sound good. But the plan should also say who maintains them and how we know whether they work after construction.',
        questions: [{ question: 'Are you worried about change?', reply: 'I want change to be reliable. Completing construction does not mean everyday life can run without further attention.' }],
        dialogue: ['After reading the proposal, she says: “Solar, greenery, rainwater and new connections all sound good. But the plan should also say who maintains them and how we know whether they work after construction.” You ask whether she is worried about change. She says: “I want change to be reliable. Completing construction does not mean everyday life can run without further attention.”'],
        need: 'I want long-term development to explain operations, resource use and impact management, so green commitments can continue in daily life.',
        options: options(
          ['Explain operating responsibilities and resident participation', 'Clarify the scope, responsibilities and practical issues residents can report.', 'Residents know how to participate. Clear explanations still need real operating arrangements behind them.'],
          ['Check operating conditions across the whole proposal', 'Compare energy, water, public facilities and maintenance needs, identifying unresolved links.', 'The proposal is less fragmented. Checking does not replace actual operation later.'],
          ['Include operation and environmental management in development', 'Arrange suitable maintenance and environmental-impact management alongside construction.', 'Green measures and public services have a more complete direction for continuity. Effects still need observation after use begins.']
        )
      }
    }
  };

  const policySummaries = {
    1: 'HDB Universal Design serves residents of different ages and abilities through continuous accessible routes, sheltered links, public rest spaces and recognisable facilities. EASE supports senior-friendly improvements inside flats and at their entrances, such as grab bars, slip-resistant treatment and suitable entrance-access measures. The two address different spatial scales and cannot replace one another. HDB Universal Design · HDB EASE',
    2: 'HDB offers older residents different housing and housing-asset options. The Lease Buyback Scheme (LBS) involves selling part of a flat’s remaining lease while continuing to live there. The Silver Housing Bonus (SHB) relates to moving to a smaller home. Other options include short-lease 2-room Flexi flats and Community Care Apartments (CCA), which combine senior-friendly housing with care services. Each has its own conditions; this narrative does not specify amounts, determine eligibility or guarantee outcomes. HDB MyNiceHome: The HDB Guide for Seniors\n\nHouseholds buying a flat should understand what they can afford before comparing choices. HDB’s budgeting information connects HFE with purchase eligibility, possible grants and loan matters; no household is assumed to receive a grant or loan. HDB: Budget for a Flat Purchase. The story then considers prices, ongoing expenses and daily life through fictional households’ comparisons. HDB MyNiceHome: How to Buy an HDB Flat',
    3: 'The Ethnic Integration Policy (EIP) uses ethnic limits at HDB block and neighbourhood levels to prevent ethnic enclaves and preserve opportunities for everyday interaction. It applies to all ethnic groups. Some transactions are restricted when relevant limits are reached, and sellers may face a smaller eligible buyer pool. The public purpose does not automatically remove an individual household’s wait or uncertainty. Official gov.sg explanation',
    4: 'The Neighbourhood Renewal Programme (NRP) improves common areas at block and precinct levels. It is fully government-funded and implemented by Town Councils. Adjacent precincts can coordinate improvements, and residents can suggest facilities and arrangements. In the real programme, at least 75% of eligible flat owners must support it at the polling stage for it to proceed. This background does not add a voting action or support-rate task to the game. Official HDB NRP information',
    5: 'The four current areas of HDB’s Green Towns Programme are reducing energy consumption, optimising resources, promoting green commute and cooling HDB towns. Cooling includes cool coatings and appropriate greenery; environmental simulation helps study sun, wind and shade. The Biophilic Town Framework considers soil, water, flora and fauna, outdoor comfort and people. It cannot be reduced to “more trees are always better”.\n\nSources: HDB Green Towns Programme; Cool coatings rollout announcement; Biophilic Towns.',
    6: 'HDB uses solar power to support common services such as lifts, lighting and water pumps. Smart lighting responds to use rather than simply turning lights off. The UrbanWater Harvesting System collects rainwater for non-potable public uses such as cleaning and irrigation, and can slow runoff through detention. Green Towns also includes e-waste recycling and green commuting, including electric-vehicle charging and support for cycling. Measures differ in whom they benefit and the conditions needed to operate.\n\nSources: HDB green-initiatives progress annex; Green Innovations; UrbanWater Harvesting pilot announcement; Green Towns Programme.',
    7: 'When planning new housing areas, HDB considers environmental studies, technical conditions, public and stakeholder feedback, housing needs and alternative sites. Ecological conservation involves more than total green area: valuable habitat and ecological connections may matter too. Development impacts require mitigation and management. Retaining some greenery does not mean there is no impact.\n\nSources: HDB Planning With the Environment in Mind; HDB revised plans announcement, 2026; HDB Sustainability Report 2023/24.'
  };
  const sourceTitles = {
    'HDB MyNiceHome：The HDB Guide for Seniors': 'HDB MyNiceHome: The HDB Guide for Seniors',
    'HDB：Budget for a Flat Purchase': 'HDB: Budget for a Flat Purchase',
    'HDB MyNiceHome：How to Buy an HDB Flat': 'HDB MyNiceHome: How to Buy an HDB Flat',
    'gov.sg官方说明': 'Official gov.sg explanation',
    'HDB年报2021/2022': 'HDB Annual Report 2021/2022',
    'HDB NRP官方说明': 'Official HDB NRP information',
    '凉爽涂料推广说明': 'Cool coatings rollout announcement',
    'HDB绿色措施进展附件': 'HDB green-initiatives progress annex',
    'UrbanWater Harvesting试点说明': 'UrbanWater Harvesting pilot announcement',
    'HDB 2026年修订规划说明': 'HDB revised plans announcement, 2026',
    'HDB可持续报告2023/24': 'HDB Sustainability Report 2023/24'
  };
  const endings = {
    win: 'In the first year, you began with a route and an entrance. Later, you heard how households compare housing choices, and saw how policies supporting shared life can also bring concrete difficulties for one family.\nWith renewal, cooling and resource use, the question grew beyond who lacked a facility. You had to consider who would use it, how it would keep operating and where the effects of a decision would reach.\nYour seven-year term ends with all three community goals met. New homes need a living environment around them, public facilities need people to use and maintain them, and immediate improvements must leave room for future people and nature. These connections will continue shaping everyday life here.',
    lose: 'Your seven-year term ends with a community goal still needing improvement.\nYou have encountered different scales of difficulty: one person’s access, a household’s home, residents living together, and the renewal, resource use and future of an entire precinct.\nLooking back, compare whether resources were concentrated on one kind of improvement, whether people outside each measure’s scope were considered, and whether immediate convenience was weighed alongside long-term needs. Next time, use these connections to arrange investment differently.'
  };

  const content = root.CM_YEAR_POLICY_CONTENT;
  if (!content || !Array.isArray(content.years)) {
    throw new Error('Load year-policy-content.js before year-policy-english.js.');
  }
  const map = Object.create(null);
  const expected = [];
  const missing = [];
  const add = (zh, en) => {
    if (typeof zh === 'string' && zh && typeof en === 'string' && en) map[zh] = en;
  };
  const expect = (zh, label) => {
    if (typeof zh === 'string' && zh) expected.push({ zh, label });
  };
  // Register repeated dialogue lines first, so opening/Q&A aliases share one translation.
  for (const y of content.years) {
    const en = years[y.year];
    for (const c of y.cases) {
      const ce = en.cases[c.residentId];
      (c.dialogue || []).forEach((line, i) => {
        let translated = ce.dialogue && ce.dialogue[i];
        if (!translated && c.dialogue.length === 1 && line.line === '“' + c.opening + '”') {
          translated = '“' + ce.opening + '”';
        }
        add(line.line, translated);
      });
    }
  }
  for (const y of content.years) {
    const en = years[y.year];
    en.policySummary = policySummaries[y.year];
    for (const key of ['title', 'story', 'closing', 'policySummary', 'setting']) {
      add(y[key], en[key]);
      expect(y[key], `year ${y.year}.${key}`);
    }
    for (const source of y.sources || []) {
      add(source.title, sourceTitles[source.title] || source.title);
      expect(source.title, `year ${y.year}.source`);
    }
    for (const c of y.cases) {
      const ce = en.cases[c.residentId];
      for (const key of ['title', 'scene', 'opening', 'need']) {
        add(c[key], ce[key]);
        expect(c[key], `year ${y.year}.${c.residentId}.${key}`);
      }
      (c.questions || []).forEach((q, i) => {
        const qe = (ce.questions || [])[i];
        for (const key of ['question', 'reply']) {
          add(q[key], qe && qe[key]);
          expect(q[key], `year ${y.year}.${c.residentId}.q${i}.${key}`);
        }
      });
      (c.dialogue || []).forEach((line, i) => expect(line.line, `year ${y.year}.${c.residentId}.dialogue${i}`));
      for (const type of ['community', 'service', 'capital']) {
        for (const key of ['name', 'description', 'result']) {
          add(c.options[type][key], ce.options[type][key]);
          expect(c.options[type][key], `year ${y.year}.${c.residentId}.${type}.${key}`);
        }
      }
    }
  }
  add('这件事里，您最希望社区回应什么？', 'What would you most like the community to address here?');
  // Additional spoken lines extracted by the existing dialogue adapter.
  add('母亲要出门，最怕听到只谈省多少，却没人说明维护怎样继续。', 'When Mother needs to go out, we worry about hearing only how much is saved, with no explanation of continuing maintenance.');
  add('我们愿意比较，得把用途和要等多久说出来。', 'We are willing to compare, but explain the uses and how long we would wait.');
  for (const key of ['win', 'lose']) {
    add(content.endings[key], endings[key]);
    expect(content.endings[key], `ending.${key}`);
  }
  // The engine renders these joins as one translation lookup.
  for (const y of content.years) {
    const intro = [y.setting, y.story].filter(Boolean);
    add(intro.join('\n\n'), intro.map(s => map[s]).join('\n\n'));
    for (const c of y.cases) {
      const opening = [c.scene, c.opening].filter(Boolean);
      if (opening.every(s => map[s])) add(opening.join('\n\n'), opening.map(s => map[s]).join('\n\n'));
    }
  }
  for (const entry of expected) {
    if (!map[entry.zh]) missing.push(entry);
  }
  root.CM_YEAR_POLICY_ENGLISH = map;
  root.CM_YEAR_POLICY_ENGLISH_COVERAGE = {
    years: content.years.length,
    households: content.years.reduce((n, y) => n + y.cases.length, 0),
    cards: content.years.reduce((n, y) => n + y.cases.length * 3, 0),
    fields: expected.length,
    translatedFields: expected.length - missing.length,
    uniqueKeys: Object.keys(map).length,
    missing
  };
  if (root.CM_I18N && typeof root.CM_I18N.register === 'function') root.CM_I18N.register(map);
})(typeof window !== 'undefined' ? window : globalThis);
