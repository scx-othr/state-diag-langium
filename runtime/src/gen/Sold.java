public class Sold extends State {

    public Sold(GumballMachine context) {
        super(context);
    }

    @Override
    public void dispense() {
        if ((context.getBalls() > 1)) {
        context.decrementBalls();
         System.out.println("dispensing ball");
            this.onExit();
            context.setState(new NoQuarter(context));
            context.getState().onEntry();
        }
        else if ((context.getBalls() == 1)) {
        context.decrementBalls();
         System.out.println("machine is empty!");
            this.onExit();
            context.setState(new SoldOut(context));
            context.getState().onEntry();
        }
}
    @Override
    public void abandon() {
        if (true) {
            this.onExit();
            context.setState(new Final(context));
            context.getState().onEntry();
        }
}
}
