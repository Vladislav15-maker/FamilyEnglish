import type { Unit, OnlineTest } from './types';

export const curriculum: Unit[] = [
  {
    id: 'unit-1',
    name: 'Unit 1: Greetings',
    rounds: [
      {
        id: 'round-1-1',
        name: 'Round 1',
        words: [
          { id: 'u1r1w1', english: 'hi', russian: 'привет', transcription: 'хай' },
          { id: 'u1r1w2', english: 'hello', russian: 'здравствуйте', transcription: 'хэллоу' },
          { id: 'u1r1w3', english: 'goodbye', russian: 'до свидания', transcription: 'гудбай' },
          { id: 'u1r1w4', english: 'good morning', russian: 'доброе утро', transcription: 'гуд морнинг' },
          { id: 'u1r1w5', english: 'good night', russian: 'спокойной ночи', transcription: 'гуд найт' },
        ],
      },
      {
        id: 'round-1-2',
        name: 'Round 2',
        words: [
          { id: 'u1r2w1', english: 'how are you', russian: 'как дела', transcription: 'хау ар ю' },
          { id: 'u1r2w2', english: 'I’m fine', russian: 'у меня все хорошо', transcription: 'айм файн' },
          { id: 'u1r2w3', english: 'nice to meet you', russian: 'приятно познакомиться', transcription: 'найс ту мит ю' },
          { id: 'u1r2w4', english: 'see you', russian: 'увидимся', transcription: 'си ю' },
          { id: 'u1r2w5', english: 'take care', russian: 'береги себя', transcription: 'тэйк кэр' },
        ],
      },
    ],
  },
  {
    id: 'unit-2',
    name: 'Unit 2: Family',
    rounds: [
      {
        id: 'round-2-1',
        name: 'Round 1',
        words: [
          { id: 'u2r1w1', english: 'mother', russian: 'мама', transcription: 'мазэр' },
          { id: 'u2r1w2', english: 'father', russian: 'папа', transcription: 'фазэр' },
          { id: 'u2r1w3', english: 'sister', russian: 'сестра', transcription: 'систэр' },
          { id: 'u2r1w4', english: 'brother', russian: 'брат', transcription: 'бразэр' },
          { id: 'u2r1w5', english: 'parents', russian: 'родители', transcription: 'пэрэнтс' },
        ],
      },
      {
        id: 'round-2-2',
        name: 'Round 2',
        words: [
          { id: 'u2r2w1', english: 'grandmother', russian: 'бабушка', transcription: 'грэндмазэр' },
          { id: 'u2r2w2', english: 'grandfather', russian: 'дедушка', transcription: 'грэндфазэр' },
          { id: 'u2r2w3', english: 'uncle', russian: 'дядя', transcription: 'анкл' },
          { id: 'u2r2w4', english: 'aunt', russian: 'тетя', transcription: 'ант' },
          { id: 'u2r2w5', english: 'cousin', russian: 'двоюродный брат/сестра', transcription: 'казн' },
        ],
      },
    ],
  },
  {
    id: 'unit-3',
    name: 'Unit 3: Food',
    rounds: [
      {
        id: 'round-3-1',
        name: 'Round 1',
        words: [
          { id: 'u3r1w1', english: 'bread', russian: 'хлеб', transcription: 'брэд' },
          { id: 'u3r1w2', english: 'milk', russian: 'молоко', transcription: 'милк' },
          { id: 'u3r1w3', english: 'water', russian: 'вода', transcription: 'уотэр' },
          { id: 'u3r1w4', english: 'juice', russian: 'сок', transcription: 'джус' },
          { id: 'u3r1w5', english: 'apple', russian: 'яблоко', transcription: 'эпл' },
        ],
      },
      {
        id: 'round-3-2',
        name: 'Round 2',
        words: [
          { id: 'u3r2w1', english: 'tea', russian: 'чай', transcription: 'ти' },
          { id: 'u3r2w2', english: 'coffee', russian: 'кофе', transcription: 'кофи' },
          { id: 'u3r2w3', english: 'orange', russian: 'апельсин', transcription: 'ориндж' },
          { id: 'u3r2w4', english: 'banana', russian: 'банан', transcription: 'бэнана' },
          { id: 'u3r2w5', english: 'salad', russian: 'салат', transcription: 'сэлэд' },
        ],
      },
    ],
  },
  {
    id: 'unit-4',
    name: 'Unit 4: Numbers',
    rounds: [
      {
        id: 'round-4-1',
        name: 'Round 1',
        words: [
          { id: 'u4r1w1', english: 'one', russian: 'один', transcription: 'уан' },
          { id: 'u4r1w2', english: 'two', russian: 'два', transcription: 'ту' },
          { id: 'u4r1w3', english: 'three', russian: 'три', transcription: 'сри' },
          { id: 'u4r1w4', english: 'four', russian: 'четыре', transcription: 'фор' },
          { id: 'u4r1w5', english: 'five', russian: 'пять', transcription: 'файв' },
        ],
      },
      {
        id: 'round-4-2',
        name: 'Round 2',
        words: [
          { id: 'u4r2w1', english: 'six', russian: 'шесть', transcription: 'сикс' },
          { id: 'u4r2w2', english: 'seven', russian: 'семь', transcription: 'сэвэн' },
          { id: 'u4r2w3', english: 'eight', russian: 'восемь', transcription: 'эйт' },
          { id: 'u4r2w4', english: 'nine', russian: 'девять', transcription: 'найн' },
          { id: 'u4r2w5', english: 'ten', russian: 'десять', transcription: 'тэн' },
        ],
      },
    ],
  },
  {
    id: 'unit-5',
    name: 'Unit 5: Colors',
    rounds: [
      {
        id: 'round-5-1',
        name: 'Round 1',
        words: [
          { id: 'u5r1w1', english: 'red', russian: 'красный', transcription: 'рэд' },
          { id: 'u5r1w2', english: 'blue', russian: 'синий', transcription: 'блу' },
          { id: 'u5r1w3', english: 'green', russian: 'зеленый', transcription: 'грин' },
          { id: 'u5r1w4', english: 'yellow', russian: 'желтый', transcription: 'йеллоу' },
          { id: 'u5r1w5', english: 'black', russian: 'черный', transcription: 'блэк' },
        ],
      },
      {
        id: 'round-5-2',
        name: 'Round 2',
        words: [
          { id: 'u5r2w1', english: 'white', russian: 'белый', transcription: 'уайт' },
          { id: 'u5r2w2', english: 'brown', russian: 'коричневый', transcription: 'браун' },
          { id: 'u5r2w3', english: 'orange', russian: 'оранжевый', transcription: 'ориндж' },
          { id: 'u5r2w4', english: 'pink', russian: 'розовый', transcription: 'пинк' },
          { id: 'u5r2w5', english: 'purple', russian: 'фиолетовый', transcription: 'пёрпл' },
        ],
      },
    ],
  },
  {
    id: 'unit-6',
    name: 'Unit 6: School',
    rounds: [
      {
        id: 'round-6-1',
        name: 'Round 1',
        words: [
          { id: 'u6r1w1', english: 'school', russian: 'школа', transcription: 'скул' },
          { id: 'u6r1w2', english: 'classroom', russian: 'класс', transcription: 'класрум' },
          { id: 'u6r1w3', english: 'teacher', russian: 'учитель', transcription: 'тичэр' },
          { id: 'u6r1w4', english: 'student', russian: 'ученик', transcription: 'стьюдэнт' },
          { id: 'u6r1w5', english: 'lesson', russian: 'урок', transcription: 'лэсэн' },
        ],
      },
      {
        id: 'round-6-2',
        name: 'Round 2',
        words: [
          { id: 'u6r2w1', english: 'book', russian: 'книга', transcription: 'бук' },
          { id: 'u6r2w2', english: 'pen', russian: 'ручка', transcription: 'пэн' },
          { id: 'u6r2w3', english: 'pencil', russian: 'карандаш', transcription: 'пэнсил' },
          { id: 'u6r2w4', english: 'desk', russian: 'парта', transcription: 'дэск' },
          { id: 'u6r2w5', english: 'chair', russian: 'стул', transcription: 'чэар' },
        ],
      },
    ],
  },
  {
    id: 'unit-7',
    name: 'Unit 7: House',
    rounds: [
      {
        id: 'round-7-1',
        name: 'Round 1',
        words: [
          { id: 'u7r1w1', english: 'house', russian: 'дом', transcription: 'хаус' },
          { id: 'u7r1w2', english: 'room', russian: 'комната', transcription: 'рум' },
          { id: 'u7r1w3', english: 'kitchen', russian: 'кухня', transcription: 'китчэн' },
          { id: 'u7r1w4', english: 'bedroom', russian: 'спальня', transcription: 'бэдрум' },
          { id: 'u7r1w5', english: 'bathroom', russian: 'ванная', transcription: 'басрум' },
        ],
      },
      {
        id: 'round-7-2',
        name: 'Round 2',
        words: [
          { id: 'u7r2w1', english: 'window', russian: 'окно', transcription: 'уиндоу' },
          { id: 'u7r2w2', english: 'door', russian: 'дверь', transcription: 'дор' },
          { id: 'u7r2w3', english: 'table', russian: 'стол', transcription: 'тэйбл' },
          { id: 'u7r2w4', english: 'bed', russian: 'кровать', transcription: 'бэд' },
          { id: 'u7r2w5', english: 'chair', russian: 'стул', transcription: 'чэар' }, // Repeated, but in data
        ],
      },
    ],
  },
  {
    id: 'unit-8',
    name: 'Unit 8: Weather',
    rounds: [
      {
        id: 'round-8-1',
        name: 'Round 1',
        words: [
          { id: 'u8r1w1', english: 'sunny', russian: 'солнечно', transcription: 'сани' },
          { id: 'u8r1w2', english: 'rainy', russian: 'дождливо', transcription: 'рэйни' },
          { id: 'u8r1w3', english: 'windy', russian: 'ветрено', transcription: 'уинди' },
          { id: 'u8r1w4', english: 'cloudy', russian: 'облачно', transcription: 'клауди' },
          { id: 'u8r1w5', english: 'snowy', russian: 'снежно', transcription: 'сноуи' },
        ],
      },
      {
        id: 'round-8-2',
        name: 'Round 2',
        words: [
          { id: 'u8r2w1', english: 'hot', russian: 'жарко', transcription: 'хот' },
          { id: 'u8r2w2', english: 'cold', russian: 'холодно', transcription: 'колд' },
          { id: 'u8r2w3', english: 'warm', russian: 'тепло', transcription: 'уорм' },
          { id: 'u8r2w4', english: 'cool', russian: 'прохладно', transcription: 'кул' },
          { id: 'u8r2w5', english: 'stormy', russian: 'штормовой', transcription: 'сторми' },
        ],
      },
    ],
  },
  {
    id: 'unit-9',
    name: 'Unit 9: Days of the Week',
    rounds: [
      {
        id: 'round-9-1',
        name: 'Round 1',
        words: [
          { id: 'u9r1w1', english: 'Monday', russian: 'понедельник', transcription: 'мандэй' },
          { id: 'u9r1w2', english: 'Tuesday', russian: 'вторник', transcription: 'тьюздэй' },
          { id: 'u9r1w3', english: 'Wednesday', russian: 'среда', transcription: 'уэнздэй' },
          { id: 'u9r1w4', english: 'Thursday', russian: 'четверг', transcription: 'сёздэй' },
          { id: 'u9r1w5', english: 'Friday', russian: 'пятница', transcription: 'фрайдэй' },
        ],
      },
      {
        id: 'round-9-2',
        name: 'Round 2',
        words: [
          { id: 'u9r2w1', english: 'Saturday', russian: 'суббота', transcription: 'сэтэдэй' },
          { id: 'u9r2w2', english: 'Sunday', russian: 'воскресенье', transcription: 'сандэй' },
          { id: 'u9r2w3', english: 'today', russian: 'сегодня', transcription: 'тудэй' },
          { id: 'u9r2w4', english: 'tomorrow', russian: 'завтра', transcription: 'тумороу' },
          { id: 'u9r2w5', english: 'yesterday', russian: 'вчера', transcription: 'йестэдэй' },
        ],
      },
    ],
  },
  {
    id: 'unit-10',
    name: 'Unit 10: Hobbies',
    rounds: [
      {
        id: 'round-10-1',
        name: 'Round 1',
        words: [
          { id: 'u10r1w1', english: 'reading', russian: 'чтение', transcription: 'ридинг' },
          { id: 'u10r1w2', english: 'playing', russian: 'игра', transcription: 'плэинг' },
          { id: 'u10r1w3', english: 'drawing', russian: 'рисование', transcription: 'дроинг' },
          { id: 'u10r1w4', english: 'swimming', russian: 'плавание', transcription: 'суиминг' },
          { id: 'u10r1w5', english: 'singing', russian: 'пение', transcription: 'сингинг' },
        ],
      },
      {
        id: 'round-10-2',
        name: 'Round 2',
        words: [
          { id: 'u10r2w1', english: 'dancing', russian: 'танцы', transcription: 'дэнсинг' },
          { id: 'u10r2w2', english: 'cooking', russian: 'готовка', transcription: 'кукинг' },
          { id: 'u10r2w3', english: 'running', russian: 'бег', transcription: 'ранинг' },
          { id: 'u10r2w4', english: 'traveling', russian: 'путешествия', transcription: 'трэвэлинг' },
          { id: 'u10r2w5', english: 'watching TV', russian: 'просмотр телевизора', transcription: 'уотчинг тиви' },
        ],
      },
    ],
  },
  {
    id: 'unit-11',
    name: 'Unit 11: At the Airport',
    rounds: [
      {
        id: 'round-11-1',
        name: 'Round 1',
        words: [
          { id: 'u11r1w1', english: 'airport', russian: 'аэропорт', transcription: 'э́эрпорт' },
          { id: 'u11r1w2', english: 'plane', russian: 'самолёт', transcription: 'плэ́йн' },
          { id: 'u11r1w3', english: 'ticket', russian: 'билет', transcription: 'ти́кит' },
          { id: 'u11r1w4', english: 'passport', russian: 'паспорт', transcription: 'па́споорт' },
          { id: 'u11r1w5', english: 'luggage', russian: 'багаж', transcription: 'ла́гидж' },
        ],
      },
      {
        id: 'round-11-2',
        name: 'Round 2',
        words: [
          { id: 'u11r2w1', english: 'boarding', russian: 'посадка', transcription: 'бо́рдинг' },
          { id: 'u11r2w2', english: 'check-in', russian: 'регистрация на рейс', transcription: 'че́к-ин' },
          { id: 'u11r2w3', english: 'flight', russian: 'рейс', transcription: 'флайт' },
          { id: 'u11r2w4', english: 'seat', russian: 'место', transcription: 'сит' },
          { id: 'u11r2w5', english: 'security', russian: 'безопасность', transcription: 'сикью́рити' },
        ],
      },
    ],
  },
  {
    id: 'unit-12',
    name: 'Unit 12: At the Hotel',
    rounds: [
      {
        id: 'round-12-1',
        name: 'Round 1',
        words: [
          { id: 'u12r1w1', english: 'hotel', russian: 'отель', transcription: 'хоутэ́л' },
          { id: 'u12r1w2', english: 'reception', russian: 'стойка регистрации', transcription: 'рисэ́пшн' },
          { id: 'u12r1w3', english: 'room key', russian: 'ключ от комнаты', transcription: 'рум ки' },
          { id: 'u12r1w4', english: 'bed', russian: 'кровать', transcription: 'бэд' },
          { id: 'u12r1w5', english: 'shower', russian: 'душ', transcription: 'ша́уэр' },
        ],
      },
      {
        id: 'round-12-2',
        name: 'Round 2',
        words: [
          { id: 'u12r2w1', english: 'breakfast', russian: 'завтрак', transcription: 'бре́кфэст' },
          { id: 'u12r2w2', english: 'dinner', russian: 'ужин', transcription: 'ди́нэр' },
          { id: 'u12r2w3', english: 'waiter', russian: 'официант', transcription: 'уэ́йтэр' },
          { id: 'u12r2w4', english: 'menu', russian: 'меню', transcription: 'ме́нью' },
          { id: 'u12r2w5', english: 'bill', russian: 'счёт', transcription: 'бил' },
        ],
      },
    ],
  },
  {
    id: 'unit-13',
    name: 'Unit 13: In the City',
    rounds: [
      {
        id: 'round-13-1',
        name: 'Round 1',
        words: [
          { id: 'u13r1w1', english: 'street', russian: 'улица', transcription: 'стрит' },
          { id: 'u13r1w2', english: 'shop', russian: 'магазин', transcription: 'шоп' },
          { id: 'u13r1w3', english: 'park', russian: 'парк', transcription: 'парк' },
          { id: 'u13r1w4', english: 'bridge', russian: 'мост', transcription: 'бридж' },
          { id: 'u13r1w5', english: 'bus', russian: 'автобус', transcription: 'бас' },
        ],
      },
      {
        id: 'round-13-2',
        name: 'Round 2',
        words: [
          { id: 'u13r2w1', english: 'train', russian: 'поезд', transcription: 'трэйн' },
          { id: 'u13r2w2', english: 'taxi', russian: 'такси', transcription: 'тэ́кси' },
          { id: 'u13r2w3', english: 'car', russian: 'машина', transcription: 'кар' },
          { id: 'u13r2w4', english: 'road', russian: 'дорога', transcription: 'роуд' },
          { id: 'u13r2w5', english: 'station', russian: 'станция', transcription: 'сте́йшн' },
        ],
      },
    ],
  },
  {
    id: 'unit-14',
    name: 'Unit 14: At the Restaurant',
    rounds: [
      {
        id: 'round-14-1',
        name: 'Round 1',
        words: [
          { id: 'u14r1w1', english: 'fork', russian: 'вилка', transcription: 'форк' },
          { id: 'u14r1w2', english: 'spoon', russian: 'ложка', transcription: 'спун' },
          { id: 'u14r1w3', english: 'knife', russian: 'нож', transcription: 'найф' },
          { id: 'u14r1w4', english: 'plate', russian: 'тарелка', transcription: 'плэйт' },
          { id: 'u14r1w5', english: 'glass', russian: 'стакан', transcription: 'глас' },
        ],
      },
      {
        id: 'round-14-2',
        name: 'Round 2',
        words: [
          { id: 'u14r2w1', english: 'soup', russian: 'суп', transcription: 'суп' },
          { id: 'u14r2w2', english: 'meat', russian: 'мясо', transcription: 'мит' },
          { id: 'u14r2w3', english: 'fish', russian: 'рыба', transcription: 'фиш' },
          { id: 'u14r2w4', english: 'rice', russian: 'рис', transcription: 'райс' },
          { id: 'u14r2w5', english: 'vegetables', russian: 'овощи', transcription: 'ве́джитэблз' },
        ],
      },
    ],
  },
  {
    id: 'unit-15',
    name: 'Unit 15: Clothes',
    rounds: [
      {
        id: 'round-15-1',
        name: 'Round 1',
        words: [
          { id: 'u15r1w1', english: 'shirt', russian: 'рубашка', transcription: 'шёрт' },
          { id: 'u15r1w2', english: 'trousers', russian: 'брюки', transcription: 'тра́узэрз' },
          { id: 'u15r1w3', english: 'dress', russian: 'платье', transcription: 'дресс' },
          { id: 'u15r1w4', english: 'skirt', russian: 'юбка', transcription: 'скёрт' },
          { id: 'u15r1w5', english: 'jacket', russian: 'куртка', transcription: 'дже́кит' },
        ],
      },
      {
        id: 'round-15-2',
        name: 'Round 2',
        words: [
          { id: 'u15r2w1', english: 'shoes', russian: 'обувь', transcription: 'шуз' },
          { id: 'u15r2w2', english: 'socks', russian: 'носки', transcription: 'сокс' },
          { id: 'u15r2w3', english: 'hat', russian: 'шляпа', transcription: 'хэт' },
          { id: 'u15r2w4', english: 'coat', russian: 'пальто', transcription: 'коут' },
          { id: 'u15r2w5', english: 'sweater', russian: 'свитер', transcription: 'све́тэр' },
        ],
      },
    ],
  },
  {
    id: 'unit-16',
    name: 'Unit 16: Body Parts',
    rounds: [
      {
        id: 'round-16-1',
        name: 'Round 1',
        words: [
          { id: 'u16r1w1', english: 'head', russian: 'голова', transcription: 'хэд' },
          { id: 'u16r1w2', english: 'hand', russian: 'кисть руки', transcription: 'хэнд' },
          { id: 'u16r1w3', english: 'leg', russian: 'нога', transcription: 'лег' },
          { id: 'u16r1w4', english: 'arm', russian: 'рука', transcription: 'арм' },
          { id: 'u16r1w5', english: 'foot', russian: 'стопа', transcription: 'фут' },
        ],
      },
      {
        id: 'round-16-2',
        name: 'Round 2',
        words: [
          { id: 'u16r2w1', english: 'eye', russian: 'глаз', transcription: 'ай' },
          { id: 'u16r2w2', english: 'ear', russian: 'ухо', transcription: 'ир' },
          { id: 'u16r2w3', english: 'nose', russian: 'нос', transcription: 'ноуз' },
          { id: 'u16r2w4', english: 'mouth', russian: 'рот', transcription: 'ма́ус' },
          { id: 'u16r2w5', english: 'hair', russian: 'волосы', transcription: 'хэ́эр' },
        ],
      },
    ],
  },
  {
    id: 'unit-17',
    name: 'Unit 17: Transport',
    rounds: [
      {
        id: 'round-17-1',
        name: 'Round 1',
        words: [
          { id: 'u17r1w1', english: 'bus stop', russian: 'автобусная остановка', transcription: 'бас стоп' },
          { id: 'u17r1w2', english: 'train station', russian: 'железнодорожная станция', transcription: 'трэйн сте́йшн' },
          { id: 'u17r1w3', english: 'motorbike', russian: 'мотоцикл', transcription: 'мо́утэбайк' },
          { id: 'u17r1w4', english: 'ticket office', russian: 'билетная касса', transcription: 'ти́кит о́фис' },
          { id: 'u17r1w5', english: 'platform', russian: 'платформа', transcription: 'плэ́тформ' },
        ],
      },
      {
        id: 'round-17-2',
        name: 'Round 2',
        words: [
          { id: 'u17r2w1', english: 'driver', russian: 'водитель', transcription: 'дра́йвер' },
          { id: 'u17r2w2', english: 'passenger', russian: 'пассажир', transcription: 'па́сэнджэр' },
          { id: 'u17r2w3', english: 'travel', russian: 'путешествовать', transcription: 'трэ́вэл' },
          { id: 'u17r2w4', english: 'map', russian: 'карта', transcription: 'мэп' },
          { id: 'u17r2w5', english: 'journey', russian: 'поездка', transcription: 'джё́рни' },
        ],
      },
    ],
  },
  {
    id: 'unit-18',
    name: 'Unit 18: Time & Calendar',
    rounds: [
      {
        id: 'round-18-1',
        name: 'Round 1',
        words: [
          { id: 'u18r1w1', english: 'morning', russian: 'утро', transcription: 'мо́рнинг' },
          { id: 'u18r1w2', english: 'afternoon', russian: 'день', transcription: 'афтэрну́н' },
          { id: 'u18r1w3', english: 'evening', russian: 'вечер', transcription: 'и́внинг' },
          { id: 'u18r1w4', english: 'night', russian: 'ночь', transcription: 'найт' },
          { id: 'u18r1w5', english: 'midnight', russian: 'полночь', transcription: 'ми́днайт' },
        ],
      },
      {
        id: 'round-18-2',
        name: 'Round 2',
        words: [
          { id: 'u18r2w1', english: 'January', russian: 'январь', transcription: 'джа́ньюэри' },
          { id: 'u18r2w2', english: 'February', russian: 'февраль', transcription: 'фе́бруэри' },
          { id: 'u18r2w3', english: 'March', russian: 'март', transcription: 'марч' },
          { id: 'u18r2w4', english: 'April', russian: 'апрель', transcription: 'э́йприл' },
          { id: 'u18r2w5', english: 'May', russian: 'май', transcription: 'мэй' },
        ],
      },
    ],
  },
  {
    id: 'unit-19',
    name: 'Unit 19: At the Beach',
    rounds: [
      {
        id: 'round-19-1',
        name: 'Round 1',
        words: [
          { id: 'u19r1w1', english: 'beach', russian: 'пляж', transcription: 'бич' },
          { id: 'u19r1w2', english: 'sand', russian: 'песок', transcription: 'сэнд' },
          { id: 'u19r1w3', english: 'sea', russian: 'море', transcription: 'си' },
          { id: 'u19r1w4', english: 'sun', russian: 'солнце', transcription: 'сан' },
          { id: 'u19r1w5', english: 'wave', russian: 'волна', transcription: 'уэйв' },
        ],
      },
      {
        id: 'round-19-2',
        name: 'Round 2',
        words: [
          { id: 'u19r2w1', english: 'swim', russian: 'плавать', transcription: 'свим' },
          { id: 'u19r2w2', english: 'shell', russian: 'ракушка', transcription: 'шел' },
          { id: 'u19r2w3', english: 'boat', russian: 'лодка', transcription: 'боут' },
          { id: 'u19r2w4', english: 'towel', russian: 'полотенце', transcription: 'та́уэл' },
          { id: 'u19r2w5', english: 'umbrella', russian: 'зонт', transcription: 'амбрэ́лла' },
        ],
      },
    ],
  },
   {
    id: 'unit-20',
    name: 'Unit 20: Everyday Activities',
    rounds: [
      {
        id: 'round-20-1',
        name: 'Round 1',
        words: [
          { id: 'u20r1w1', english: 'wake up', russian: 'просыпаться', transcription: 'уэйк ап' },
          { id: 'u20r1w2', english: 'wash', russian: 'мыться', transcription: 'вош' },
          { id: 'u20r1w3', english: 'eat', russian: 'есть', transcription: 'ит' },
          { id: 'u20r1w4', english: 'drink', russian: 'пить', transcription: 'дринк' },
          { id: 'u20r1w5', english: 'sleep', russian: 'спать', transcription: 'слип' },
        ],
      },
      {
        id: 'round-20-2',
        name: 'Round 2',
        words: [
          { id: 'u20r2w1', english: 'walk', russian: 'ходить пешком', transcription: 'вок' },
          { id: 'u20r2w2', english: 'run', russian: 'бегать', transcription: 'ран' },
          { id: 'u20r2w3', english: 'read', russian: 'читать', transcription: 'рид' },
          { id: 'u20r2w4', english: 'write', russian: 'писать', transcription: 'райт' },
          { id: 'u20r2w5', english: 'listen', russian: 'слушать', transcription: 'ли́сэн' },
        ],
      },
    ],
  },
];

export const OFFLINE_TESTS = [
  { id: 'offline-test-1', name: 'Оффлайн Тест 1 (Юниты 1-2)' },
  { id: 'offline-test-2', name: 'Оффлайн Тест 2 (Юниты 3-4)' },
  { id: 'offline-test-3', name: 'Оффлайн Тест 3 (Юниты 5-6)' },
  { id: 'offline-test-4', name: 'Оффлайн Тест 4 (Юниты 7-8)' },
  { id: 'offline-test-5', name: 'Оффлайн Тест 5 (Юниты 9-10)' },
];

export const ONLINE_TESTS: OnlineTest[] = [
    {
        id: 'online-test-1',
        name: 'Онлайн Тест 1 (Юниты 1-2)',
        description: 'Этот тест проверяет знания по темам "Приветствия" и "Семья".',
        durationMinutes: 5,
        words: [
          ...curriculum.find(u => u.id === 'unit-1')!.rounds.flatMap(r => r.words).slice(0, 5),
          ...curriculum.find(u => u.id === 'unit-2')!.rounds.flatMap(r => r.words).slice(0, 5)
        ]
    },
    {
        id: 'online-test-2',
        name: 'Онлайн Тест 2 (Юниты 3-4)',
        description: 'Этот тест проверяет знания по темам "Еда" и "Числа".',
        durationMinutes: 5,
        words: [
          ...curriculum.find(u => u.id === 'unit-3')!.rounds.flatMap(r => r.words).slice(0, 5),
          ...curriculum.find(u => u.id === 'unit-4')!.rounds.flatMap(r => r.words).slice(0, 5)
        ]
    },
     {
        id: 'online-test-3',
        name: 'Онлайн Тест 3 (Юниты 5-6)',
        description: 'Этот тест проверяет знания по темам "Цвета" и "Школа".',
        durationMinutes: 5,
        words: [
          ...curriculum.find(u => u.id === 'unit-5')!.rounds.flatMap(r => r.words).slice(0, 5),
          ...curriculum.find(u => u.id === 'unit-6')!.rounds.flatMap(r => r.words).slice(0, 5)
        ]
    },
    {
        id: 'online-test-4',
        name: 'Онлайн Тест 4 (Юниты 7-8)',
        description: 'Этот тест проверяет знания по темам "Дом" и "Погода".',
        durationMinutes: 5,
        words: [
          ...curriculum.find(u => u.id === 'unit-7')!.rounds.flatMap(r => r.words).slice(0, 5),
          ...curriculum.find(u => u.id === 'unit-8')!.rounds.flatMap(r => r.words).slice(0, 5)
        ]
    },
    {
        id: 'online-test-5',
        name: 'Онлайн Тест 5 (Юниты 9-10)',
        description: 'Этот тест проверяет знания по темам "Дни недели" и "Хобби".',
        durationMinutes: 5,
        words: [
          ...curriculum.find(u => u.id === 'unit-9')!.rounds.flatMap(r => r.words).slice(0, 5),
          ...curriculum.find(u => u.id === 'unit-10')!.rounds.flatMap(r => r.words).slice(0, 5)
        ]
    },
];


export const REMEDIATION_UNITS: { [key: string]: Unit } = {
  'offline-test-1': {
    id: 'rem-unit-offline-1', name: 'Работа над ошибками (Оффлайн Тест 1)',
    rounds: [
      { id: 'rem-offline-1-1', name: 'Повторение 1', words: curriculum.find(u => u.id === 'unit-1')!.rounds[0].words },
      { id: 'rem-offline-1-2', name: 'Повторение 2', words: curriculum.find(u => u.id === 'unit-2')!.rounds[0].words },
    ],
  },
  'offline-test-2': {
    id: 'rem-unit-offline-2', name: 'Работа над ошибками (Оффлайн Тест 2)',
    rounds: [
      { id: 'rem-offline-2-1', name: 'Повторение 1', words: curriculum.find(u => u.id === 'unit-3')!.rounds[0].words },
      { id: 'rem-offline-2-2', name: 'Повторение 2', words: curriculum.find(u => u.id === 'unit-4')!.rounds[0].words },
    ],
  },
  'offline-test-3': {
    id: 'rem-unit-offline-3', name: 'Работа над ошибками (Оффлайн Тест 3)',
    rounds: [
      { id: 'rem-offline-3-1', name: 'Повторение 1', words: curriculum.find(u => u.id === 'unit-5')!.rounds[0].words },
      { id: 'rem-offline-3-2', name: 'Повторение 2', words: curriculum.find(u => u.id === 'unit-6')!.rounds[0].words },
    ],
  },
  'offline-test-4': {
    id: 'rem-unit-offline-4', name: 'Работа над ошибками (Оффлайн Тест 4)',
    rounds: [
      { id: 'rem-offline-4-1', name: 'Повторение 1', words: curriculum.find(u => u.id === 'unit-7')!.rounds[0].words },
      { id: 'rem-offline-4-2', name: 'Повторение 2', words: curriculum.find(u => u.id === 'unit-8')!.rounds[0].words },
    ],
  },
  'offline-test-5': {
    id: 'rem-unit-offline-5', name: 'Работа над ошибками (Оффлайн Тест 5)',
    rounds: [
      { id: 'rem-offline-5-1', name: 'Повторение 1', words: curriculum.find(u => u.id === 'unit-9')!.rounds[0].words },
      { id: 'rem-offline-5-2', name: 'Повторение 2', words: curriculum.find(u => u.id === 'unit-10')!.rounds[0].words },
    ],
  },
  'online-test-1': {
    id: 'rem-unit-online-1', name: 'Работа над ошибками (Онлайн Тест 1)',
    rounds: [
      { id: 'rem-online-1-1', name: 'Повторение 1', words: curriculum.find(u => u.id === 'unit-1')!.rounds[1].words },
      { id: 'rem-online-1-2', name: 'Повторение 2', words: curriculum.find(u => u.id === 'unit-2')!.rounds[1].words },
    ],
  },
   'online-test-2': {
    id: 'rem-unit-online-2', name: 'Работа над ошибками (Онлайн Тест 2)',
    rounds: [
      { id: 'rem-online-2-1', name: 'Повторение 1', words: curriculum.find(u => u.id === 'unit-3')!.rounds[1].words },
      { id: 'rem-online-2-2', name: 'Повторение 2', words: curriculum.find(u => u.id === 'unit-4')!.rounds[1].words },
    ],
  },
  'online-test-3': {
    id: 'rem-unit-online-3', name: 'Работа над ошибками (Онлайн Тест 3)',
    rounds: [
      { id: 'rem-online-3-1', name: 'Повторение 1', words: curriculum.find(u => u.id === 'unit-5')!.rounds[1].words },
      { id: 'rem-online-3-2', name: 'Повторение 2', words: curriculum.find(u => u.id === 'unit-6')!.rounds[1].words },
    ],
  },
  'online-test-4': {
    id: 'rem-unit-online-4', name: 'Работа над ошибками (Онлайн Тест 4)',
    rounds: [
      { id: 'rem-online-4-1', name: 'Повторение 1', words: curriculum.find(u => u.id === 'unit-7')!.rounds[1].words },
      { id: 'rem-online-4-2', name: 'Повторение 2', words: curriculum.find(u => u.id === 'unit-8')!.rounds[1].words },
    ],
  },
  'online-test-5': {
    id: 'rem-unit-online-5', name: 'Работа над ошибками (Онлайн Тест 5)',
    rounds: [
      { id: 'rem-online-5-1', name: 'Повторение 1', words: curriculum.find(u => u.id === 'unit-9')!.rounds[1].words },
      { id: 'rem-online-5-2', name: 'Повторение 2', words: curriculum.find(u => u.id === 'unit-10')!.rounds[1].words },
    ],
  },
};

export function getUnitById(unitId: string): Unit | null {
  const allUnits = [...curriculum, ...Object.values(REMEDIATION_UNITS)];
  return allUnits.find(unit => unit.id === unitId) || null;
}

export function getRoundById(unitId: string, roundId: string): Unit['rounds'][0] | null {
  const unit = getUnitById(unitId);
  return unit?.rounds.find(round => round.id === roundId) || null;
}

export function getWordById(unitId: string, roundId: string, wordId: string) {
  const round = getRoundById(unitId, roundId);
  return round?.words.find(word => word.id === wordId) || null;
}

export function getOnlineTestById(testId: string): OnlineTest | undefined {
    return ONLINE_TESTS.find(test => test.id === testId);
}
