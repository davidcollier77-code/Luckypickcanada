/**
 * Little Sparks — the Lucky Meter's daily motivational note.
 *
 * This file is intentionally plain data so the Spark list can be edited without
 * touching selection, storage or presentation code. Every entry needs a stable,
 * unique `id`; the meter stores only the id in its recent history.
 *
 * Sparks are short, positive motivation. They are not fortunes, predictions or
 * promises, and they never replace the Crystal Ball's fortune experience.
 */
export const LITTLE_SPARKS = [
  { id: 'spark-01', message: 'Even a small step forward can change the direction of your day.' },
  { id: 'spark-02', message: 'You do not have to rush to make real progress.' },
  { id: 'spark-03', message: 'A kind word costs little and can travel a long way.' },
  { id: 'spark-04', message: 'Rest is part of the work, not a break from it.' },
  { id: 'spark-05', message: 'The effort you made yesterday still counts today.' },
  { id: 'spark-06', message: 'Your pace is your own, and it is allowed to change.' },
  { id: 'spark-07', message: 'Begin before you feel ready; clarity often arrives while you move.' },
  { id: 'spark-08', message: 'You can be proud of a quiet, unglamorous kind of progress.' },
  { id: 'spark-09', message: 'One honest conversation can clear more space than a week of worrying.' },
  { id: 'spark-10', message: 'Keep the promise you made to yourself, even a small one.' },
  { id: 'spark-11', message: 'You are allowed to ask for help before you are exhausted.' },
  { id: 'spark-12', message: 'A difficult morning does not decide the whole day.' },
  { id: 'spark-13', message: 'Notice what is working, not only what is unfinished.' },
  { id: 'spark-14', message: 'You can choose a smaller goal and still finish strong.' },
  { id: 'spark-15', message: 'The person beside you may be carrying something invisible; go gently.' },
  { id: 'spark-16', message: 'Your attention is a gift; spend a little of it on something you love.' },
  { id: 'spark-17', message: 'Slow work still builds something real.' },
  { id: 'spark-18', message: 'You have handled hard days before, and you learned something each time.' },
  { id: 'spark-19', message: 'Leave a little room in your plan for something good.' },
  { id: 'spark-20', message: 'Doing your best today may look different from yesterday, and that is fine.' },
  { id: 'spark-21', message: 'A fresh start does not need a new year; it can start after lunch.' },
  { id: 'spark-22', message: 'Make the next choice simple, then make it.' },
  { id: 'spark-23', message: 'Say the appreciative thing out loud while the moment is here.' },
  { id: 'spark-24', message: 'You are more than the list of things you did not finish.' },
  { id: 'spark-25', message: 'Small, consistent care adds up to something you can stand on.' },
  { id: 'spark-26', message: 'Give yourself the same patience you offer a friend.' },
  { id: 'spark-27', message: 'If today feels heavy, carry only what today actually needs.' },
  { id: 'spark-28', message: 'Curiosity is a practical tool; let it lead you past the first obstacle.' },
  { id: 'spark-29', message: 'The work you do quietly still shapes the person you are becoming.' },
  { id: 'spark-30', message: 'End the day by naming one thing you are glad you tried.' },
];

export const SPARKS_BY_ID = new Map(LITTLE_SPARKS.map((spark) => [spark.id, spark]));
