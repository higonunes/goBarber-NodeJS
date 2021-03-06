import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';

import Appointment from '../models/Appointments';
import User from '../models/User';
import File from '../models/File';
import Notifications from '../schemas/Notifications';

import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const appointment = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [{ model: File, as: 'avatar', attributes: ['path', 'url'] }],
        },
      ],
    });
    return res.json(appointment);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, date } = req.body;

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }

    const hourStart = startOfHour(parseISO(date));
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permited' });
    }

    const checkAbailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAbailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not availabe' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    const user = await User.findByPk(req.userId);
    const formatedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM ', às' H:mm'h'",
      { locale: pt }
    );
    await Notifications.create({
      content: `Novo agendamento de ${user.name} para o ${formatedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        { model: User, as: 'provider', attributes: ['email', 'name'] },
        { model: User, as: 'user', attributes: ['email', 'name'] },
      ],
    });

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({ error: 'Not permeted' });
    }

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({ error: 'Not permited by hours' });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    await Queue.add(CancellationMail.key, {
      appointment,
    });
    return res.json(appointment);
  }
}

export default new AppointmentController();
