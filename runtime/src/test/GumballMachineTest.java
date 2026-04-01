import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

public class GumballMachineTest {
    private GumballMachine instance;

    @Before
    public void setUp() {
        instance = new GumballMachine(1);
    }

    @Test
    public void testStateCoverage() {
        assertEquals(NoQuarter.class, instance.getState().getClass());
        assertEquals(1, instance.getBalls());

        instance.insertQuarter();

        assertEquals(HasQuarter.class, instance.getState().getClass());
        assertEquals(1, instance.getBalls());

        instance.turnCrank();

        assertEquals(Sold.class, instance.getState().getClass());
        assertEquals(1, instance.getBalls());

        instance.dispense();

        assertEquals(SoldOut.class, instance.getState().getClass());
        assertEquals(0, instance.getBalls());
    }

    @Test
    public void testTransitionCoverage() {
        assertEquals(NoQuarter.class, instance.getState().getClass());
        assertEquals(1, instance.getBalls());

        instance.insertQuarter();

        assertEquals(HasQuarter.class, instance.getState().getClass());
        assertEquals(1, instance.getBalls());

        instance.eject();

        assertEquals(NoQuarter.class, instance.getState().getClass());
        assertEquals(1, instance.getBalls());

        instance.insertQuarter();

        assertEquals(HasQuarter.class, instance.getState().getClass());
        assertEquals(1, instance.getBalls());

        instance.turnCrank();

        assertEquals(Sold.class, instance.getState().getClass());
        assertEquals(1, instance.getBalls());

        instance.dispense();

        assertEquals(SoldOut.class, instance.getState().getClass());
        assertEquals(0, instance.getBalls());

        instance.refill(1);

        assertEquals(NoQuarter.class, instance.getState().getClass());
        assertEquals(1, instance.getBalls());

        instance.insertQuarter();

        assertEquals(HasQuarter.class, instance.getState().getClass());
        assertEquals(1, instance.getBalls());

        instance.turnCrank();

        assertEquals(Sold.class, instance.getState().getClass());
        assertEquals(1, instance.getBalls());

        instance.dispense();

        assertEquals(SoldOut.class, instance.getState().getClass());
        assertEquals(0, instance.getBalls());

        instance.abandon();
        assertNull(instance.getState());
    }
}


