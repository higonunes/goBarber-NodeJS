import {
  startOfDay,
  endOfDay,
  parseISO,
  getHours,
  setHours,
  setMinutes,
  setSeconds,
  isBefore,
} from 'date-fns';
import { Op } from 'sequelize';
import Appointment from '../models/Appointments';
import User from '../models/User';

const schedule = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

class ScheduleController {
  async index(req, res) {
    const checkUserProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkUserProvider) {
      return res.status(401).json({ error: 'User is not provider' });
    }

    const { date } = req.query;
    const parseDate = parseISO(date);

    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(parseDate), endOfDay(parseDate)],
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
      order: ['date'],
    });

    const list = schedule.map((h) => {
      const checkExists = appointments.find(
        (a) => getHours(a.date) === Number(h.split(':')[0])
      );

      const horas = setSeconds(
        setMinutes(setHours(parseDate, Number(h.split(':')[0])), 0),
        0
      );

      if (checkExists) {
        return {
          avaliable: false,
          past: isBefore(horas, new Date()),
          ...checkExists.dataValues,
        };
      }
      return {
        avaliable: true,
        past: isBefore(horas, new Date()),
        date: horas,
      };
    });

    return res.json(list);
  }
}

export default new ScheduleController();
