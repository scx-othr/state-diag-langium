import javax.swing.plaf.nimbus.State;

public class Sold extends State {

    public Sold(GumballMachine context) {
        super(context);
    }

    @Override
    public void dispense() {
        if ((context.getBalls() > 1)) {
            this.onExit();
            context.decrementBalls();
            System.out.println("dispensing ball");
            context.setState(new NoQuarter(context));
            context.getState().onEntry();
        }
        else if ((context.getBalls() == 1)) {
            this.onExit();
            context.decrementBalls(); 
            System.out.println("machine is empty!");
            context.setState(new SoldOut(context));
            context.getState().onEntry();
        }
}
    @Override
    public void abandon() {
        if (true) {
            this.onExit();
            context.setState(new TheEnd(context));
            context.getState().onEntry();
        }
}
}
