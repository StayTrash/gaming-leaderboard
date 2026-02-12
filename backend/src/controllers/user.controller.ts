import { Request, Response } from "express";
import { createUserService } from "../services/user.service";

export async function createUser(req: Request, res: Response) {
  try {
    const { username } = req.body;

    const user = await createUserService(username);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}
